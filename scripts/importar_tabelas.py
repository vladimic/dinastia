#!/usr/bin/env python3
"""
Dinastia · leitor das tabelas de grupo (PDF Ademicon) -> JSON + SQL de carga.

Uso:
  python3 scripts/importar_tabelas.py PASTA_OU_PDFS... --sql saida.sql --json saida.json

Cada PDF vira um grupo com: características, tabela de créditos (todas as colunas
de parcela, inclusive reduzidas), modalidades de contemplação com regras de embutido
e sequência de contemplação por faixa de assembleias.

Validações (um PDF que falha em erro fica de fora da carga):
  - prazo da cota = prazo do grupo - (assembleia - 1)
  - parcela diluída 100% x prazo da cota ~= crédito x (1 + taxa adm.)   (tolerância 0,1%)
  - 1% antecipado: 1ª parcela = demais + 1% do crédito                   (tolerância R$ 0,05)
  - seguro proporcional ao crédito em todas as linhas
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

MESES = {m: i + 1 for i, m in enumerate(
    ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
     "agosto", "setembro", "outubro", "novembro", "dezembro"])}

FAMILIAS = {"imóveis": "imoveis", "imoveis": "imoveis", "veículos": "veiculos",
            "veiculos": "veiculos", "serviços": "servicos", "servicos": "servicos"}


def num(s):
    return float(s.replace(".", "").replace(",", "."))


def tipo_por_nome(nome):
    n = nome.lower()
    if "sorteio" in n and "cancel" in n:
        return "SORTEIO_COTA_CANCELADA"
    if "sorteio" in n:
        return "SORTEIO_ATIVO"
    if "livre" in n:
        return "LANCE_LIVRE"
    if "limitado" in n:
        return "LANCE_LIMITADO"
    if "fixo" in n:
        return "LANCE_FIXO"
    if "fidelidade" in n:
        return "LANCE_FIDELIDADE"
    raise ValueError(f"modalidade desconhecida: {nome!r}")


class ErroLeitura(Exception):
    pass


def ler_pdf(caminho: Path):
    texto = subprocess.run(["pdftotext", "-layout", str(caminho), "-"],
                           capture_output=True, text=True, check=True).stdout
    linhas = texto.splitlines()
    plano = re.sub(r"\s+", " ", texto)
    erros, avisos = [], []

    m = re.search(r"Grupo (\d+) - Consórcio de ([\wÀ-ú ]+?)\s{2,}|Grupo (\d+) - Consórcio de ([\wÀ-ú]+)", texto)
    if not m:
        raise ErroLeitura("cabeçalho 'Grupo N - Consórcio de ...' não encontrado")
    numero = m.group(1) or m.group(3)
    fam_txt = (m.group(2) or m.group(4)).strip().lower()
    familia = FAMILIAS.get(fam_txt, "outros-bens")

    m = re.search(r"(\d+)ª Assembleia de Contemplação - (\d+) de (\w+) de (\d{4})", plano)
    if not m:
        raise ErroLeitura("assembleia não encontrada")
    assembleia = int(m.group(1))
    data_assembleia = f"{m.group(4)}-{MESES[m.group(3).lower()]:02d}-{int(m.group(2)):02d}"

    def pega(rx, conv=lambda x: x, obrig=True):
        r = re.search(rx, plano)
        if not r:
            if obrig:
                raise ErroLeitura(f"campo não encontrado: {rx}")
            return None
        return conv(r.group(1))

    taxa = pega(r"Taxa de Administração ([\d,]+)%", num)
    prazo_cota = pega(r"Prazo da Cota: (\d+) meses", int)
    prazo_grupo = pega(r"Prazo do Grupo: (\d+) meses", int)
    participantes = pega(r"Número de Participantes: (\d+)", int)
    indice = pega(r"Indice de Correção: ([A-Z-]+)")
    mes_reaj = pega(r"aplicado anualmente no mês de (\w+)", lambda s: MESES[s.lower()], obrig=False)
    pc = re.search(r"1ª Correção (\w+) (\d{4})", plano)
    primeira_correcao = f"{pc.group(2)}-{MESES[pc.group(1).lower()]:02d}-01" if pc else None
    vencimento = pega(r"Vencimento todo o dia (\d+)", int, obrig=False)
    if vencimento is None:
        avisos.append("dia de vencimento não informado na tabela")
    seg = re.search(r"Seguro Prestamista (opcional|obrigatório) até a Contemplação e após (obrigatório|opcional)", plano)
    limite = pega(r"não pode ultrapassar o limite de (.+?anos, \d+ meses e \d+ dias)", obrig=False)

    # ---------------- tabela de créditos ----------------
    i_cod = next(i for i, l in enumerate(linhas) if l.strip().startswith("Cod."))
    i_ref = next(i for i, l in enumerate(linhas) if l.strip().startswith("Ref."))
    cab = linhas[i_cod:i_ref]
    x_antecip = min(l.find("1 Parcela") for l in cab if "1 Parcela" in l) - 3
    pcts = []
    for l in cab:
        for p in re.finditer(r"(\d+)%", l):
            pcts.append((p.start(), int(p.group(1))))
    dil = [p for x, p in sorted(pcts) if x < x_antecip]
    ant = [p for x, p in sorted(pcts) if x >= x_antecip]
    if not dil or dil[0] != 100:
        raise ErroLeitura(f"colunas de parcela diluída não reconhecidas: {dil}")

    creditos = []
    for l in linhas[i_ref + 1:]:
        if "Taxa de Administração" in l:
            break
        r = re.match(r"^\s+(\d{3,5})\s+(.*)$", l)
        if not r:
            continue
        vals = re.findall(r"\d{1,3}(?:\.\d{3})*,\d{2}", r.group(2))
        esperado = 1 + len(dil) + 2 * len(ant) + 1
        if len(vals) != esperado:
            raise ErroLeitura(f"linha {r.group(1)}: {len(vals)} valores, esperava {esperado}")
        v = [num(x) for x in vals]
        parcelas = []
        k = 1
        for p in dil:
            parcelas.append({"plano": "DILUIDA", "pct": p, "primeira": v[k], "demais": v[k]})
            k += 1
        for p in ant:
            parcelas.append({"plano": "ANTECIPADO_1", "pct": p, "primeira": v[k], "demais": v[k + 1]})
            k += 2
        creditos.append({"cod": r.group(1), "credito": v[0], "seguro": v[-1], "parcelas": parcelas})
    if not creditos:
        raise ErroLeitura("nenhuma linha de crédito encontrada")

    # ---------------- modalidades ----------------
    lim = re.search(r"Lance Limitado até (\d+) parcelas de lance \((\d+)% da categoria\)", plano)
    fix = re.search(r"Lance Fixo (\d+) parcelas de lance \((\d+)% da categoria\)", plano)
    fid = (re.search(r"máximo de (\d+) PARCELAS \((\d+)%\)", plano)
           or re.search(r"Lance Fidelidade até (\d+) parcelas de lance \((\d+)% da categoria\)", plano))
    fid_ass = pega(r"CONCORREM NA (\d+)ª ASSEMBLEIA DA COTA", int, obrig=False)
    fid_parc = pega(r"efetuarem o pagamento de (\d+) parcelas", int, obrig=False)
    nao_transfere = "NÃO TRANSFERE O BENEFÍCIO" in plano

    # modalidades que o grupo oferece = as listadas em "Modalidades de Contemplações: ..."
    ml = re.search(r"Modalidades de Contemplações: (.*?)\*Categoria", plano)
    if not ml:
        raise ErroLeitura("linha 'Modalidades de Contemplações' não encontrada")
    presentes = {tipo_por_nome(p) for p in re.split(r" - ", ml.group(1).strip()) if p.strip()}
    modal = {t: {"max": None, "pct_cat": None, "emb_parc": None, "emb_base": None,
                 "emb_pct": None, "rec_proprio": None, "a_partir": 1, "req": None,
                 "transf": True, "emb_texto": None}
             for t in ["SORTEIO_ATIVO", "SORTEIO_COTA_CANCELADA", "LANCE_LIVRE",
                       "LANCE_LIMITADO", "LANCE_FIXO", "LANCE_FIDELIDADE"] if t in presentes}
    if "LANCE_LIMITADO" in modal:
        if lim:
            modal["LANCE_LIMITADO"].update(max=int(lim.group(1)), pct_cat=float(lim.group(2)))
        else:
            erros.append("regra do lance limitado não encontrada")
    if "LANCE_FIXO" in modal:
        if fix:
            modal["LANCE_FIXO"].update(max=int(fix.group(1)), pct_cat=float(fix.group(2)))
        else:
            erros.append("regra do lance fixo não encontrada")
    if "LANCE_FIDELIDADE" in modal:
        if fid:
            modal["LANCE_FIDELIDADE"].update(
                max=int(fid.group(1)), pct_cat=float(fid.group(2)),
                a_partir=fid_ass or 1, transf=not nao_transfere,
                req=(f"{fid_parc} parcelas pagas (consecutivas ou não) e participação em {fid_parc} assembleias; "
                     "antecipações não contam") if fid_parc else None)
        else:
            erros.append("regra do lance fidelidade não encontrada")

    lances = [t for t in modal if t.startswith("LANCE_")]
    todas_proprio = re.search(r"Em todas as modalidades 100% do lance deve ser pago com recursos próprios", plano)
    emb = re.search(r"((?:Lances?|Lance) [\wÀ-ú ,]{0,40}: permitido descontar.*?)(?:Entregas condicionadas|$)", plano)
    if todas_proprio:
        for t in lances:
            modal[t].update(rec_proprio=True, emb_texto="100% do lance com recursos próprios (sem embutido)")
    elif not emb:
        erros.append("regras de embutido não encontradas")
    else:
        for seg_txt in emb.group(1).split("|"):
            seg_txt = seg_txt.strip()
            if ":" not in seg_txt:
                continue
            sujeito, regra = seg_txt.split(":", 1)
            tipos = [t for k, t in [("Livre", "LANCE_LIVRE"), ("Limitado", "LANCE_LIMITADO"),
                                    ("Fixo", "LANCE_FIXO"), ("Fidelidade", "LANCE_FIDELIDADE")]
                     if k in sujeito]
            r1 = re.search(r"embutir\)\s*(aprox\.\s*)?(\d+) parcelas \((\d+)% (do valor ofertado|da categoria)\)", regra)
            r2 = re.search(r"embutir\)\s*(\d+)% do valor ofertado", regra)
            for t in tipos:
                if t not in modal:
                    avisos.append(f"embutido citado para {t}, que o grupo não oferece")
                    continue
                d = modal[t]
                d["emb_texto"] = regra.strip().rstrip(".")
                if r1:
                    d.update(emb_parc=int(r1.group(2)), emb_pct=float(r1.group(3)),
                             emb_base="ofertado" if "ofertado" in r1.group(4) else "categoria")
                elif r2:
                    d.update(emb_pct=float(r2.group(1)), emb_base="ofertado")
                d["rec_proprio"] = not (d["emb_base"] == "ofertado" and d["emb_pct"] == 100)
        for t in lances:
            if modal[t]["emb_texto"] is None:
                avisos.append(f"regra de embutido de {t} não encontrada")

    # ---------------- sequência ----------------
    faixas = []
    demais_multiplo = []
    for f in re.finditer(r"Da (\d+)ª a (\d+)ª Assembleia: (.*?) - Demais contemplações seguem com "
                         r"(a mesma sequencia|Lance \w+(?: e Lance \w+)?)", plano):
        itens = []
        for parte in f.group(3).split(" - "):
            r = re.match(r"(\d+) (.+)", parte.strip())
            if not r:
                raise ErroLeitura(f"item de sequência não reconhecido: {parte!r}")
            itens.append({"qtd": int(r.group(1)), "tipo": tipo_por_nome(r.group(2))})
        if f.group(4).startswith("a mesma"):
            demais = None
        else:
            tipos_demais = [tipo_por_nome(x) for x in f.group(4).split(" e ")]
            demais = tipos_demais[0]
            if len(tipos_demais) > 1:
                # o modelo guarda um único tipo para "demais"; o texto completo vai para observações
                demais_multiplo.append(f"Da {f.group(1)}ª a {f.group(2)}ª assembleia, demais contemplações seguem com {f.group(4)}.")
        faixas.append({"de": int(f.group(1)), "ate": int(f.group(2)), "itens": itens, "demais": demais})
    if demais_multiplo:
        avisos.append("demais contemplações com mais de uma modalidade (gravado o 1º tipo; texto completo em observações)")
    if not faixas:
        erros.append("sequência de contemplação não encontrada")

    obs = list(demais_multiplo)
    if "Entregas condicionadas a efetiva arrecadação" in plano:
        obs.append("Entregas condicionadas à efetiva arrecadação do grupo.")
    if "Loteria Federal" in plano:
        obs.append("Sorteio e desempate dos lances pela Loteria Federal.")
    if "sofrer alterações sem aviso prévio" in plano:
        obs.append("Valores e condições podem mudar sem aviso prévio.")

    # ---------------- validações ----------------
    if prazo_cota != prazo_grupo - (assembleia - 1):
        erros.append(f"prazo da cota {prazo_cota} ≠ {prazo_grupo} - ({assembleia} - 1)")
    razoes_seg = []
    for c in creditos:
        d100 = next(p for p in c["parcelas"] if p["plano"] == "DILUIDA" and p["pct"] == 100)
        esperado = c["credito"] * (1 + taxa / 100)
        dif = abs(d100["primeira"] * prazo_cota - esperado) / esperado
        if dif > 0.001:
            erros.append(f"{c['cod']}: diluída×prazo difere {dif:.3%} de crédito×(1+taxa)")
        for p in c["parcelas"]:
            if p["plano"] == "ANTECIPADO_1" and abs(p["primeira"] - p["demais"] - c["credito"] * 0.01) > 0.05:
                erros.append(f"{c['cod']}: 1ª parcela antecipada ({p['pct']}%) ≠ demais + 1% do crédito")
        razoes_seg.append(c["seguro"] / c["credito"])
    if max(razoes_seg) - min(razoes_seg) > 0.000002:
        avisos.append("seguro não é proporcional ao crédito em todas as linhas")

    return {
        "arquivo": caminho.name.split("-", 1)[-1] if re.match(r"^[0-9a-f]{8}-", caminho.name) else caminho.name,
        "hash": hashlib.sha256(caminho.read_bytes()).hexdigest(),
        "numero": numero, "familia": familia, "assembleia": assembleia,
        "data_assembleia": data_assembleia, "taxa_adm": taxa, "prazo_cota": prazo_cota,
        "prazo_grupo": prazo_grupo, "participantes": participantes, "indice": indice,
        "mes_reajuste": mes_reaj, "primeira_correcao": primeira_correcao,
        "vencimento": vencimento,
        "seguro_opcional_pre": bool(seg and seg.group(1) == "opcional"),
        "seguro_obrigatorio_pos": bool(seg and seg.group(2) == "obrigatório"),
        "idade_limite": limite, "observacoes": " ".join(obs) or None,
        "planos": {"DILUIDA": dil, "ANTECIPADO_1": ant},
        "seguro_pct_mes": round(sum(razoes_seg) / len(razoes_seg) * 100, 4) if razoes_seg else None,
        "creditos": creditos, "modalidades": modal, "faixas": faixas,
        "erros": erros, "avisos": avisos,
    }


def q(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def arr(vals):
    return "'{" + ",".join(f"{v:.2f}" for v in vals) + "}'"


TIPO_PARCELA = {100: "NORMAL", 85: "RED_85", 70: "RED_70", 55: "RED_55", 50: "RED_50"}


def json_auditoria(g):
    """Resumo do que foi lido do PDF (o plano 1% antecipado é desconsiderado).
    As parcelas diluídas ficam como casos de teste do motor de cálculo: {crédito: {pct: parcela}}."""
    return {
        "grupo": g["numero"], "assembleia": g["assembleia"], "prazo_cota": g["prazo_cota"],
        "taxa_adm": g["taxa_adm"], "seguro_pct_mes": g["seguro_pct_mes"], "avisos": g["avisos"],
        "parcelas_diluidas": {f"{c['credito']:.2f}": {str(p["pct"]): p["primeira"] for p in c["parcelas"] if p["plano"] == "DILUIDA"}
                              for c in g["creditos"]},
    }


def payload(g):
    """JSON aceito pela função importar_grupo() do banco."""
    tipos = []
    for p in g["planos"]["DILUIDA"]:
        if p not in TIPO_PARCELA:
            raise ErroLeitura(f"grupo {g['numero']}: parcela {p}% sem tipo_parcela cadastrado")
        tipos.append(TIPO_PARCELA[p])
    limpa = lambda d: {k: v for k, v in d.items() if v is not None}
    return limpa({
        "numero": int(g["numero"]), "familia": g["familia"].replace("-", "_"),
        "assembleia": g["assembleia"], "data_assembleia": g["data_assembleia"],
        "prazo_grupo": g["prazo_grupo"], "prazo_cota": g["prazo_cota"],
        "participantes": g["participantes"], "taxa_adm": g["taxa_adm"],
        "seguro_pct_mes": g["seguro_pct_mes"], "indice": g["indice"],
        "mes_reajuste": g["mes_reajuste"], "primeira_correcao": g["primeira_correcao"],
        "vencimento": g["vencimento"], "observacoes": g["observacoes"],
        "arquivo": g["arquivo"], "hash": g["hash"], "aprovado_por": "importação inicial",
        "creditos": [round(c["credito"], 2) for c in g["creditos"]],
        "tipos_parcela": tipos,
        "modalidades": [limpa({"tipo": t, **{k: v for k, v in m.items()}}) for t, m in g["modalidades"].items()],
        "faixas": [limpa({"de": f["de"], "ate": f["ate"], "demais": f["demais"],
                          "itens": [{"tipo": i["tipo"], "qtd": i["qtd"]} for i in f["itens"]]}) for f in g["faixas"]],
        "auditoria": json_auditoria(g),
    })


def sql_grupo(g):
    j = json.dumps(payload(g), ensure_ascii=False, separators=(",", ":"))
    return f"-- Grupo {g['numero']} · {g['assembleia']}ª assembleia · {g['arquivo']}\nselect importar_grupo({q(j)}::jsonb);"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("entradas", nargs="+")
    ap.add_argument("--sql")
    ap.add_argument("--json")
    a = ap.parse_args()

    pdfs = []
    for e in a.entradas:
        p = Path(e)
        pdfs += sorted(p.glob("*.pdf")) if p.is_dir() else [p]

    grupos, falhas = [], []
    for p in pdfs:
        try:
            g = ler_pdf(p)
        except (ErroLeitura, StopIteration, ValueError, KeyError) as ex:
            falhas.append((p.name, str(ex) or type(ex).__name__))
            continue
        (falhas.append((p.name, "; ".join(g["erros"]))) if g["erros"] else grupos.append(g))
        estado = "ERRO" if g["erros"] else "ok"
        print(f"{estado:4} {g['arquivo']:16} grupo {g['numero']:>6} · {g['assembleia']:>3}ª · "
              f"{len(g['creditos']):>2} créditos · diluída {g['planos']['DILUIDA']} · antecipado {g['planos']['ANTECIPADO_1']}"
              + (f" · avisos: {g['avisos']}" if g["avisos"] else ""))
    for nome, motivo in falhas:
        print(f"FORA {nome}: {motivo}", file=sys.stderr)

    grupos.sort(key=lambda g: int(g["numero"]))
    if a.json:
        Path(a.json).write_text(json.dumps(grupos, ensure_ascii=False, indent=1))
    if a.sql:
        Path(a.sql).write_text("-- Carga gerada por scripts/importar_tabelas.py (usa a função importar_grupo)\n\n"
                               + "\n\n".join(sql_grupo(g) for g in grupos) + "\n")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
