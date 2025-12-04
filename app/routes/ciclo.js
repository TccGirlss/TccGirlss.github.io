module.exports = function(app) {

  console.log("ROTA CICLO CARREGADA");

  app.get('/api/ciclo/lista', function(req, res) {

    console.log("📌 ROTA /api/ciclo/lista ACESSADA");

    const db = app.infra.connectionFactory();
    const usuario_id = req.session.usuario?.id;

    console.log("📌 usuario_id:", usuario_id);

    if (!usuario_id) {
      console.log("❌ Usuário não autenticado!");
      return res.status(401).json({ erro: "Usuário não autenticado" });
    }

    const sql = `
      SELECT data_inicio, data_fim
      FROM calendario_eventos
      WHERE usuario_id = ? AND tipo = 'menstruacao'
      ORDER BY data_inicio DESC
    `;

    db.query(sql, [usuario_id], function(err, rows) {

      if (err) {
        console.log("❌ ERRO NO MySQL:", err);
        return res.status(500).json({ erro: "Erro interno no servidor" });
      }

      console.log("📌 Registros retornados:", rows.length);

      if (!rows || rows.length < 2) {
        console.log("⚠️ Usuário não tem registros suficientes.");
        return res.json([]);
      }

      const ciclos = [];
      const MS_DAY = 24 * 60 * 60 * 1000;
      const hoje = new Date();

      for (let i = 0; i < rows.length - 1; i++) {

        const atual = rows[i];
        const anterior = rows[i + 1];

        if (!atual.data_fim) {
          console.log(`⚠️ Ignorando ciclo ${i+1} porque data_fim é nula (em andamento).`);
          continue;
        }

        const inicioAtual = new Date(atual.data_inicio);
        const fimAtual = new Date(atual.data_fim);
        const inicioAnterior = new Date(anterior.data_inicio);

        if (isNaN(inicioAtual) || isNaN(fimAtual) || isNaN(inicioAnterior)) {
          console.log("❌ ERRO: datas inválidas detectadas!", { atual, anterior });
          continue;
        }

        if (fimAtual > hoje) {
          console.log(`⚠️ Ignorando ciclo ${i+1} porque ainda não terminou (fimAtual: ${fimAtual.toISOString()}).`);
          continue;
        }

        const cicloDias = Math.floor((inicioAtual - inicioAnterior) / MS_DAY);

        const menstruacaoDias = Math.floor((fimAtual - inicioAtual) / MS_DAY) + 1;

        const mesAnterior = inicioAnterior.toLocaleString("pt-BR", { month: "long" });
        const mesAtual = inicioAtual.toLocaleString("pt-BR", { month: "long" });
        const titulo = `${mesAnterior} - ${mesAtual}`;

        console.log(`📌 Ciclo ${i+1}: ${titulo} | cicloDias=${cicloDias} | menstruacaoDias=${menstruacaoDias}`);

        ciclos.push({
          titulo,
          cicloDias,
          menstruacaoDias
        });
      }

      console.log("📌 Resultado final:", ciclos);

      return res.json(ciclos);
    });
  });
};
