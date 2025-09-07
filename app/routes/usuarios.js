var bcrypt = require('bcryptjs');

module.exports = function(app) {
    app.get('/', function(request, response) {
        if (request.session.usuario) {
            return response.redirect('/inicio');
        }
        response.render('index.ejs');
    });

    app.get('/login', function(request, response) {
        response.render('usuarios/login.ejs', { erro: null });
    });

    app.post('/login', function(request, response) {
        var connection = app.infra.connectionFactory();
        var usuariosDAO = new app.infra.UsuariosDAO(connection);

        var email = request.body.email;
        var senha = request.body.senha;

        usuariosDAO.buscarPorEmail(email, function(err, results) {
            if (err) {
                return response.send('Erro ao buscar usuário!');
            }
            if (results.length == 0) {
                return response.render('usuarios/login.ejs', { erro: 'Usuário não encontrado!' });
            }

            var usuario = results[0];

            bcrypt.compare(senha, usuario.senha, function(err, result) {
                if (result) {
                    request.session.usuario = usuario;
                    response.redirect('/inicio');
                } else {
                    response.render('usuarios/login.ejs', { erro: 'Usuário ou senha inválidos!' });
                }
            });
            connection.end();
        });
    });

    app.get('/logout', function(request, response) {
        request.session.destroy();
        response.redirect('/');
    });

    app.get('/registro', function(request, response) {
        response.render('usuarios/registro.ejs', { errosValidacao: {}, usuario: {} });
    });

    app.post('/registro', function(request, response) {
        var connection = app.infra.connectionFactory();
        var usuariosDAO = new app.infra.UsuariosDAO(connection);
        var usuario = request.body;

        request.assert('nome', 'Nome é obrigatório!').notEmpty();
        request.assert('email', 'E-mail é obrigatório!').notEmpty();
        request.assert('senha', 'Senha é obrigatória!').notEmpty();

        var erros = request.validationErrors();
        if (erros) {
            return response.render('usuarios/registro.ejs', { errosValidacao: erros, usuario: usuario });
        }

        bcrypt.hash(usuario.senha, 12, function(err, hash) {
            usuario.senha = hash;
            usuariosDAO.salvar(usuario, function(err, results) {
                if (err) {
                    return response.send('Erro ao salvar o usuário!');
                }
                response.redirect('/login');
            });
            connection.end();
        });
    });

    app.get('/inicio', function(request, response) {
        if (!request.session.usuario) {
            return response.redirect('/');
        }
        response.render('home/inicio.ejs', { usuario: request.session.usuario });
    });
};
