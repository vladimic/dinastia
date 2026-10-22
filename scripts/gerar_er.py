"""Gera docs/modelo-er.svg (modelo entidade-relacionamento) a partir do dicionário de dados.
Uso:  npx tsx scripts/exportar_dicionario.mts /tmp/dic.json && python3 scripts/gerar_er.py /tmp/dic.json docs/modelo-er.svg
As posições das tabelas estão no dicionário `pos` abaixo: ao criar uma tabela nova, acrescente a posição e as ligações (rel)."""
import json, html, sys
dic=json.load(open(sys.argv[1],encoding='utf-8'))
tb={t['tabela']:t for t in dic['DICIONARIO']}
W=280; LH=18; HH=30
pos={
 'indice_correcao':(30,30),'grupo':(30,170),
 'arquivo_importado':(380,30),'grupo_assembleia':(380,300),
 'tipo_parcela':(730,30),'grupo_assembleia_tipo_parcela':(730,150),
 'grupo_modalidade':(730,300),'tipo_contemplacao':(1080,380),
 'grupo_sequencia_faixa':(380,640),'grupo_sequencia':(730,640),
 'importacao_item':(30,900),'importacao_diferenca':(380,900),'importacao_faltante':(730,900),
 'parametros_gerais':(1080,900),'usuario':(1080,30),'lista_grupos':(30,640),
}
def alt(t): return HH+len(tb[t]['colunas'])*LH+10
def box(t):
    x,y=pos[t]; return x,y,W,alt(t)
cor={'Cadastros de apoio':'#7a5af8','Grupos e assembleias':'#1b1744','Importação de PDFs':'#c2410c','Acesso':'#0f766e'}
out=[]
def side(t,s,off=0.5):
    x,y,w,h=box(t)
    return {'l':(x,y+h*off),'r':(x+w,y+h*off),'t':(x+w*off,y),'b':(x+w*off,y+h)}[s]
def rel(pai,sp,filho,sf,label,via=(),offp=0.5,offf=0.5):
    a=side(pai,sp,offp); b=side(filho,sf,offf)
    pts=[a,*via,b]
    d=' '.join(f'{x:.0f},{y:.0f}' for x,y in pts)
    out.append(f'<polyline points="{d}" fill="none" stroke="#6b7280" stroke-width="1.6"/>')
    # marcas 1 (pai) e N (filho)
    def marca(p,texto,q):
        dx=(q[0]-p[0]); dy=(q[1]-p[1]); n=max(1,(dx*dx+dy*dy)**.5)
        x=p[0]+dx/n*14; y=p[1]+dy/n*14
        out.append(f'<text x="{x-4:.0f}" y="{y+4:.0f}" font-size="13" font-weight="700" fill="#111">{texto}</text>')
    marca(pts[0],'1',pts[1]); marca(pts[-1],'N',pts[-2])
    m=pts[len(pts)//2-1] if len(pts)>2 else ((a[0]+b[0])/2,(a[1]+b[1])/2)
    if len(pts)>2: m=((pts[len(pts)//2-1][0]+pts[len(pts)//2][0])/2,(pts[len(pts)//2-1][1]+pts[len(pts)//2][1])/2)
    out.append(f'<text x="{m[0]+4:.0f}" y="{m[1]-4:.0f}" font-size="11" fill="#374151" font-style="italic">{html.escape(label)}</text>')
rel('indice_correcao','b','grupo','t','indice')
rel('grupo','r','grupo_assembleia','l','grupo_numero',offp=0.5,offf=0.3)
rel('arquivo_importado','b','grupo_assembleia','t','arquivo_id')
rel('grupo_assembleia','r','grupo_assembleia_tipo_parcela','l','grupo_assembleia_id',via=((690,317),(690,184)),offp=0.07,offf=0.5)
rel('tipo_parcela','b','grupo_assembleia_tipo_parcela','t','tipo_parcela')
rel('grupo_assembleia','r','grupo_modalidade','l','grupo_assembleia_id',offp=0.35,offf=0.35)
rel('tipo_contemplacao','l','grupo_modalidade','r','tipo',offp=0.2,offf=0.5)
rel('grupo_assembleia','b','grupo_sequencia_faixa','t','grupo_assembleia_id')
rel('grupo_sequencia_faixa','r','grupo_sequencia','l','faixa_id')
rel('tipo_contemplacao','b','grupo_sequencia','r','tipo',via=((1220,600),(1030,600),(1030,690)),offp=0.5,offf=0.3)
rel('tipo_contemplacao','b','grupo_sequencia_faixa','b','demais_tipo',via=((1260,800),(520,800)),offp=0.85,offf=0.5)
rel('importacao_item','r','importacao_diferenca','l','item_id')
rel('grupo','b','importacao_faltante','t','grupo_numero',via=((130,830),(870,830)),offp=0.2,offf=0.5)
body=[]
for t,(x,y) in pos.items():
    d=tb[t]; h=alt(t); c=cor[d['grupo']]
    body.append(f'<g><rect x="{x}" y="{y}" width="{W}" height="{h}" rx="8" fill="#fff" stroke="{c}" stroke-width="2"/><path d="M{x},{y+8} a8,8 0 0 1 8,-8 h{W-16} a8,8 0 0 1 8,8 v{HH-8} h-{W} z" fill="{c}"/><text x="{x+10}" y="{y+20}" font-size="14" font-weight="700" fill="#fff">{t}</text>')
    for i,col in enumerate(d['colunas']):
        yy=y+HH+(i+1)*LH-5
        ch=col.get('chave') or ''
        marca='PK' if ch.startswith('PK') else ('FK' if 'FK' in ch else ('UK' if 'UK' in ch else ''))
        w='700' if marca=='PK' else '400'
        st='italic' if marca=='FK' else 'normal'
        body.append(f'<text x="{x+10}" y="{yy}" font-size="12" font-weight="{w}" font-style="{st}" fill="#111">{col["nome"]}</text>')
        body.append(f'<text x="{x+W-10}" y="{yy}" font-size="11" text-anchor="end" fill="#6b7280">{marca+"  " if marca else ""}{html.escape(col["tipo"])}</text>')
    body.append('</g>')
leg=[('Cadastros de apoio',cor['Cadastros de apoio']),('Grupos e assembleias',cor['Grupos e assembleias']),('Importação de PDFs',cor['Importação de PDFs']),('Acesso',cor['Acesso'])]
legsvg=''.join(f'<rect x="{30+i*230}" y="1215" width="14" height="14" fill="{c}"/><text x="{50+i*230}" y="1227" font-size="12" fill="#111">{n}</text>' for i,(n,c) in enumerate(leg))
svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1270" viewBox="0 0 1400 1270" font-family="Helvetica, Arial, sans-serif"><rect width="1400" height="1270" fill="#faf8f3"/><text x="30" y="20" font-size="16" font-weight="700" fill="#1b1744">Dinastia · Modelo entidade-relacionamento</text>'+''.join(out)+''.join(body)+legsvg+'<text x="30" y="1255" font-size="12" fill="#374151">1 = lado pai · N = lado filho (vários) · PK chave primária · FK chave estrangeira · UK único</text></svg>'
open(sys.argv[2],'w',encoding='utf-8').write(svg)
print('ok')
