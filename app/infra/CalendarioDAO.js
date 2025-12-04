function CalendarioDAO(connection) {
    this._connection = connection;
}

CalendarioDAO.prototype.salvarEvento = function (evento, callback) {
    const sql = `
        INSERT INTO calendario_eventos 
        (usuario_id, tipo, data_inicio, data_fim, sintomas, medicamentos, duracao_menstruacao, cor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this._connection.query(sql, [
        evento.usuario_id,
        evento.tipo,
        evento.data_inicio,
        evento.data_fim,
        evento.sintomas,
        evento.medicamentos,
        evento.duracao_menstruacao,
        evento.cor
    ], callback);
};

CalendarioDAO.prototype.buscarEventosPorUsuario = function (usuario_id, callback) {
    const sql = `
        SELECT * FROM calendario_eventos 
        WHERE usuario_id = ? 
        ORDER BY data_inicio ASC
    `;
    this._connection.query(sql, [usuario_id], callback);
};

CalendarioDAO.prototype.buscarEventosPorPeriodo = function (usuario_id, data_inicio, data_fim, callback) {
    const sql = `
        SELECT * FROM calendario_eventos 
        WHERE usuario_id = ? 
        AND (
            (data_inicio BETWEEN ? AND ?) 
            OR (data_fim BETWEEN ? AND ?)
            OR (? BETWEEN data_inicio AND data_fim)
            OR (? BETWEEN data_inicio AND data_fim)
        )
        ORDER BY data_inicio ASC
    `;
    this._connection.query(sql, [usuario_id, data_inicio, data_fim, data_inicio, data_fim, data_inicio, data_fim], callback);
};

CalendarioDAO.prototype.buscarUltimaMenstruacao = function (usuario_id, callback) {
    const sql = `
        SELECT * FROM calendario_eventos 
        WHERE usuario_id = ? AND tipo = 'menstruacao'
        ORDER BY data_inicio DESC 
        LIMIT 1
    `;
    this._connection.query(sql, [usuario_id], callback);
};

CalendarioDAO.prototype.removerEvento = function (evento_id, usuario_id, callback) {
    const sql = `
        DELETE FROM calendario_eventos 
        WHERE id = ? AND usuario_id = ?
    `;
    this._connection.query(sql, [evento_id, usuario_id], callback);
};

module.exports = function () {
    return CalendarioDAO;
};