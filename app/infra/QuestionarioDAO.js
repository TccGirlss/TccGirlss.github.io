// app/infra/QuestionarioDAO.js

function QuestionarioDAO(connection) {
    this._connection = connection;
}

QuestionarioDAO.prototype.salvarRespostas = function(dados, callback) {
    const sql = `
        INSERT INTO questionario 
        (usuario_id, faixa_etaria, peso, altura, menarca, ciclo_regular, duracao_menstruacao, intensidade_fluxo, usa_anticoncepcional, sintomas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this._connection.query(sql, [
        dados.usuario_id,
        dados.faixa_etaria,
        dados.peso,
        dados.altura,
        dados.menarca,
        dados.ciclo_regular,
        dados.duracao_menstruacao,
        dados.intensidade_fluxo,
        dados.usa_anticoncepcional,
        dados.sintomas
    ], callback);
};

module.exports = function() {
    return QuestionarioDAO;
};
