-- Dinastia · 0016: pagamento com furo conforme a Tabela Resumo (PDF de 17/09/2026)
-- S em 54 grupos e N em 92; vale só para a versão vigente de cada grupo. Grupos que não estão no resumo não mudam.
-- Mudaram 51: 49 de N para S (12150 a 12200, exceto os que já eram S) e 760 e 820 de S para N.
-- Aplicada no Supabase via MCP em 15/10/2026.
update grupo_assembleia ga set pagamento_com_furo = true
 where ga.grupo_numero in (12150, 12151, 12153, 12155, 12156, 12157, 12158, 12159, 12160, 12161, 12162, 12163, 12164, 12165, 12166, 12167, 12168, 12169, 12170, 12171, 12172, 12173, 12174, 12175, 12176, 12177, 12178, 12179, 12180, 12181, 12182, 12183, 12184, 12185, 12186, 12187, 12188, 12189, 12190, 12191, 12192, 12193, 12194, 12195, 12196, 12197, 12198, 12199, 12200, 12201, 12202, 12203, 12207, 12208)
   and ga.assembleia_numero = (select max(assembleia_numero) from grupo_assembleia x where x.grupo_numero = ga.grupo_numero);
update grupo_assembleia ga set pagamento_com_furo = false
 where ga.grupo_numero in (370, 420, 530, 540, 550, 560, 570, 580, 590, 600, 611, 620, 630, 640, 651, 660, 670, 680, 690, 700, 710, 720, 730, 740, 750, 760, 770, 780, 790, 800, 810, 820, 830, 840, 850, 860, 870, 880, 890, 900, 910, 921, 930, 940, 950, 960, 970, 980, 990, 1000, 1010, 1020, 1030, 1040, 1050, 1060, 1070, 1080, 1090, 1100, 1110, 1120, 1180, 1190, 12000, 12001, 12126, 12127, 12128, 12129, 12130, 12131, 12132, 12133, 12134, 12135, 12136, 12137, 12138, 12139, 12140, 12141, 12142, 12143, 12144, 12145, 12146, 12147, 12148, 12149, 12152, 12154)
   and ga.assembleia_numero = (select max(assembleia_numero) from grupo_assembleia x where x.grupo_numero = ga.grupo_numero);
