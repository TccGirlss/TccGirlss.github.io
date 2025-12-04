function UsuariosDAO(connection) {
    this._connection = connection;
}

UsuariosDAO.prototype.buscarPorEmail = function (email, callback) {
    console.log('🔍 Buscando usuário por email:', email);
    this._connection.query('SELECT * FROM usuarios WHERE email = ?', [email], function (err, results) {
        if (err) {
            console.error('❌ Erro na busca por email:', err);
        } else {
            console.log('✅ Usuários encontrados:', results.length);
        }
        callback(err, results);
    });
}

UsuariosDAO.prototype.buscarPorId = function (id, callback) {
    console.log('🔍 Buscando usuário por ID:', id);
    this._connection.query('SELECT * FROM usuarios WHERE id = ?', [id], function (err, results) {
        if (err) {
            console.error('❌ Erro na busca por ID:', err);
        } else {
            console.log('✅ Usuário encontrado:', results.length > 0 ? 'Sim' : 'Não');
        }
        callback(err, results);
    });
}

UsuariosDAO.prototype.salvar = function (usuario, callback) {
    console.log('💾 Salvando novo usuário:', usuario.email);
    this._connection.query('INSERT INTO usuarios SET ?', usuario, function (err, results) {
        if (err) {
            console.error('❌ Erro ao salvar usuário:', err);
            console.error('🔍 SQL Error:', err.sqlMessage);
        } else {
            console.log('✅ Usuário salvo com sucesso. ID:', results.insertId);
        }
        callback(err, results);
    });
}

UsuariosDAO.prototype.atualizar = function (id, usuario, callback) {
    console.log('🔄 EXECUTANDO UPDATE NO BANCO:');
    console.log('👤 ID do usuário:', id);
    console.log('📤 Dados para update:', usuario);

    this._connection.query('UPDATE usuarios SET ? WHERE id = ?', [usuario, id], function (err, result) {
        if (err) {
            console.error('❌ ERRO NO UPDATE DO USUÁRIO:');
            console.error('🔍 Mensagem:', err.message);
            console.error('🔍 Código:', err.code);
            console.error('🔍 SQL Message:', err.sqlMessage);
            console.error('🔍 SQL:', err.sql);
        } else {
            console.log('✅ UPDATE EXECUTADO COM SUCESSO!');
            console.log('📊 Linhas afetadas:', result.affectedRows);
            console.log('🔍 Resultado completo:', result);
        }
        callback(err, result);
    });
}

UsuariosDAO.prototype.marcarQuestionarioRespondido = function (usuarioId, callback) {
    console.log('✅ Marcando questionário como respondido para usuário:', usuarioId);
    this._connection.query('UPDATE usuarios SET questionarioRespondido = 1 WHERE id = ?', [usuarioId], function (err, results) {
        if (err) {
            console.error('❌ Erro ao marcar questionário respondido:', err);
        } else {
            console.log('✅ Questionário marcado como respondido. Linhas afetadas:', results.affectedRows);
        }
        callback(err, results);
    });
}

UsuariosDAO.prototype.salvarTokenReset = function (email, token, expira, callback) {
  this._connection.query(
    'UPDATE usuarios SET reset_token = ?, reset_token_expira = ? WHERE email = ?',
    [token, expira, email],
    callback
  );
};

UsuariosDAO.prototype.buscarPorToken = function (token, callback) {
  this._connection.query(
    'SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expira > NOW()',
    [token],
    callback
  );
};

UsuariosDAO.prototype.atualizarSenha = function (id, novaSenhaHash, callback) {
  this._connection.query(
    'UPDATE usuarios SET senha = ?, reset_token = NULL, reset_token_expira = NULL WHERE id = ?',
    [novaSenhaHash, id],
    callback
  );
};


module.exports = function () {
    return UsuariosDAO;
}