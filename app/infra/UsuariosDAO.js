function UsuariosDAO(connection){
    this._connection = connection;
}

UsuariosDAO.prototype.buscarPorEmail = function(email, callback){
    this._connection.query('select * from usuarios where email = ?', [email], callback);
}

UsuariosDAO.prototype.salvar = function(usuario, callback){
    this._connection.query('insert into usuarios set ?', usuario, callback);
}

// Novo método para atualizar o campo de questionário respondido
UsuariosDAO.prototype.marcarQuestionarioRespondido = function(usuarioId, callback){
    this._connection.query('update usuarios set questionarioRespondido = 1 where id = ?', [usuarioId], callback);
}

module.exports = function(){
    return UsuariosDAO;
}
