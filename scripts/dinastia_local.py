#!/usr/bin/env python3
"""
Dinastia Local · ajudante que roda no seu Mac e conversa com o site do Dinastia.

O navegador não consegue abrir o Finder com o caminho completo, nem ler as suas pastas pelo caminho.
Este programa faz isso por ele: o site chama http://127.0.0.1:8765 e este programa abre o Finder (e, na
próxima etapa, lê os PDFs das pastas).

Uso (Terminal):
  python3 scripts/dinastia_local.py
  python3 scripts/dinastia_local.py --origem https://SEU-SITE.vercel.app     # se o endereço do site for outro

Só aceita pedidos vindos dos sites informados em --origem (padrão: https://dinastia.vercel.app e http://localhost:3000)
e só responde em 127.0.0.1 (nada sai do seu computador por aqui).
"""
import argparse
import json
import os
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VERSAO = "1"
ORIGENS_PADRAO = ["https://dinastia.vercel.app", "http://localhost:3000"]


def pasta_existente_mais_proxima(caminho: str) -> str:
    """Sobe pelo caminho até achar uma pasta que existe; sem nenhuma, usa a pasta do usuário."""
    p = os.path.expanduser((caminho or "").strip())
    while p and p != os.path.dirname(p):
        if os.path.isdir(p):
            return p
        p = os.path.dirname(p)
    return os.path.expanduser("~")


def aspas_applescript(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def escolher_pasta(inicio: str, titulo: str) -> str | None:
    """Abre o seletor de pastas do Finder já posicionado em `inicio`. Devolve o caminho completo ou None se cancelar."""
    fake = os.environ.get("DINASTIA_PASTA_TESTE")  # só para testes automáticos
    if fake is not None:
        return fake or None
    base = pasta_existente_mais_proxima(inicio)
    script = (
        'tell application "System Events"\n'
        "  activate\n"
        f'  set p to choose folder with prompt "{aspas_applescript(titulo)}" '
        f'default location (POSIX file "{aspas_applescript(base)}" as alias)\n'
        "  return POSIX path of p\n"
        "end tell"
    )
    r = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
    if r.returncode != 0:
        if "-128" in r.stderr:  # cancelado pelo usuário
            return None
        raise RuntimeError(r.stderr.strip() or "não foi possível abrir o Finder")
    return r.stdout.strip().rstrip("/") or None


def fazer_handler(origens):
    class H(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):
            sys.stderr.write("[dinastia-local] " + fmt % args + "\n")

        def _origem_ok(self):
            o = self.headers.get("Origin", "")
            return o if o in origens else None

        def _cabecalhos(self, status, origem):
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            if origem:
                self.send_header("Access-Control-Allow-Origin", origem)
                self.send_header("Vary", "Origin")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type")
                self.send_header("Access-Control-Allow-Private-Network", "true")
            self.end_headers()

        def _json(self, status, corpo):
            self._cabecalhos(status, self._origem_ok())
            self.wfile.write(json.dumps(corpo, ensure_ascii=False).encode())

        def do_OPTIONS(self):
            origem = self._origem_ok()
            self._cabecalhos(204 if origem else 403, origem)

        def do_GET(self):
            if not self._origem_ok():
                return self._json(403, {"erro": "origem não autorizada; use --origem"})
            if self.path == "/status":
                return self._json(200, {"ok": True, "versao": VERSAO})
            self._json(404, {"erro": "não encontrado"})

        def do_POST(self):
            if not self._origem_ok():
                return self._json(403, {"erro": "origem não autorizada; use --origem"})
            try:
                tamanho = int(self.headers.get("Content-Length", "0"))
                corpo = json.loads(self.rfile.read(tamanho) or b"{}")
            except Exception:
                return self._json(400, {"erro": "pedido inválido"})
            if self.path == "/escolher-pasta":
                try:
                    caminho = escolher_pasta(str(corpo.get("inicio", "")), str(corpo.get("titulo", "Escolha a pasta")))
                except Exception as e:  # noqa: BLE001
                    return self._json(500, {"erro": str(e)})
                return self._json(200, {"cancelado": True} if caminho is None else {"caminho": caminho})
            self._json(404, {"erro": "não encontrado"})

    return H


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--origem", action="append", help="endereço do site autorizado (pode repetir)")
    ap.add_argument("--porta", type=int, default=8765)
    a = ap.parse_args()
    origens = set(ORIGENS_PADRAO + (a.origem or []))
    srv = ThreadingHTTPServer(("127.0.0.1", a.porta), fazer_handler(origens))
    print(f"Dinastia Local ativo em http://127.0.0.1:{a.porta}  (sites autorizados: {', '.join(sorted(origens))})")
    print("Deixe esta janela aberta enquanto usa o Dinastia. Ctrl+C para encerrar.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
