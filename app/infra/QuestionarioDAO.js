function QuestionarioDAO(connection) {
    this._connection = connection;
}

QuestionarioDAO.prototype.salvarRespostas = function (dados, callback) {
    console.log('💾 SALVANDO QUESTIONÁRIO NO BANCO:');
    console.log('👤 ID do usuário:', dados.usuario_id);
    console.log('📋 Dados recebidos:', dados);

    const sql = `
        INSERT INTO questionario 
        (usuario_id, faixa_etaria, peso, altura, menarca, ciclo_regular, duracao_menstruacao, duracao_ciclo, intensidade_fluxo, usa_anticoncepcional, sintomas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this._connection.query(sql, [
        dados.usuario_id,
        dados.faixa_etaria,
        dados.peso,
        dados.altura,
        dados.menarca,
        dados.ciclo_regular,
        dados.duracao_menstruacao,
        dados.duracao_ciclo || 28,
        dados.intensidade_fluxo,
        dados.usa_anticoncepcional,
        dados.sintomas
    ], function (erro, resultado) {
        if (erro) {
            console.error("❌ ERRO CRÍTICO AO SALVAR QUESTIONÁRIO:");
            console.error("🔍 Mensagem:", erro.message);
            console.error("🔍 SQL Message:", erro.sqlMessage);
            console.error("🔍 SQL:", erro.sql);
        } else {
            console.log("✅ QUESTIONÁRIO SALVO COM SUCESSO!");
            console.log("🆔 ID Inserido:", resultado.insertId);
        }

        callback(erro, resultado);
    });
};

QuestionarioDAO.prototype.buscarPorUsuarioId = function (usuario_id, callback) {
    console.log('🔍 Buscando questionário do usuário:', usuario_id);
    this._connection.query('SELECT * FROM questionario WHERE usuario_id = ?', [usuario_id], function (err, results) {
        if (err) {
            console.error('❌ Erro ao buscar questionário:', err);
        } else {
            console.log('✅ Questionários encontrados:', results.length);
        }
        callback(err, results);
    });
};

QuestionarioDAO.prototype.atualizar = function (id, dados, callback) {
    console.log('🔄 ATUALIZANDO QUESTIONÁRIO NO BANCO:');
    console.log('📋 ID do questionário:', id);
    console.log('📤 Dados para update:', dados);

    const sql = `
        UPDATE questionario 
        SET faixa_etaria = ?, peso = ?, altura = ?, menarca = ?, ciclo_regular = ?, 
            duracao_menstruacao = ?, intensidade_fluxo = ?, usa_anticoncepcional = ?
        WHERE id = ?
    `;

    this._connection.query(sql, [
        dados.faixa_etaria,
        dados.peso,
        dados.altura,
        dados.menarca,
        dados.ciclo_regular,
        dados.duracao_menstruacao,
        dados.intensidade_fluxo,
        dados.usa_anticoncepcional,
        id
    ], function (err, result) {
        if (err) {
            console.error('❌ ERRO AO ATUALIZAR QUESTIONÁRIO:');
            console.error('🔍 Mensagem:', err.message);
            console.error('🔍 SQL Message:', err.sqlMessage);
            console.error('🔍 SQL:', err.sql);
        } else {
            console.log('✅ QUESTIONÁRIO ATUALIZADO COM SUCESSO!');
            console.log('📊 Linhas afetadas:', result.affectedRows);
        }
        callback(err, result);
    });
};

module.exports = function () {
    return QuestionarioDAO;
};