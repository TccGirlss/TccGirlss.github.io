function UsuariosDAO(connection){
    this._connection = connection;
}

UsuariosDAO.prototype.buscarPorEmail = function(email, callback){
    this._connection.query('select * from usuarios where email = ?'
    , [email], callback);
}

UsuariosDAO.prototype.salvar = function(usuario, callback){
    this._connection.query('insert into usuarios set ?',
        usuario, callback);
}

module.exports = function(){
    return UsuariosDAO;
}