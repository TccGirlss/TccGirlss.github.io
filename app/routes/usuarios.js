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

                    // Redirecionar para questionário se não respondeu ainda
                    if (usuario.questionarioRespondido) {
                        response.redirect('/inicio');
                    } else {
                        response.redirect(`/home/comeco?usuario_id=${usuario.id}`);
                    }

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

                // Define o ID do usuário recém-criado
                usuario.id = results.insertId;
                // Inicializa a flag questionarioRespondido como falso (não respondeu ainda)
                usuario.questionarioRespondido = 0;

                // Salva usuário na sessão
                request.session.usuario = usuario;

                // Redireciona para o início do questionário passando o ID do usuário
                response.redirect(`/home/comeco?usuario_id=${usuario.id}`);
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

app.get('/inicio', function(request, response) {
    if (!request.session.usuario) {
        return response.redirect('/');
    }
    response.render('home/inicio.ejs', { usuario: request.session.usuario });
});



app.post('/api/questionario', function(request, response) {
    const dados = request.body;
    const connection = app.infra.connectionFactory();
    const questionarioDAO = new app.infra.QuestionarioDAO(connection);

    console.log(dados); // Para debugar

    questionarioDAO.salvarRespostas(dados, function(err, results) {
        connection.end();
        if (err) return response.status(500).json({ erro: 'Erro ao salvar respostas' });
        response.json({ sucesso: true });
    });
});

// --- ENDPOINT PARA MARCAR QUESTIONÁRIO COMO RESPONDIDO ---
app.post('/api/marcarQuestionarioRespondido', function(request, response) {
    const usuarioId = request.body.usuario_id;
    const connection = app.infra.connectionFactory();
    const usuariosDAO = new app.infra.UsuariosDAO(connection);

    usuariosDAO.marcarQuestionarioRespondido(usuarioId, function(err, results) {
        connection.end();
        if (err) return response.status(500).json({ erro: 'Erro ao atualizar status do questionário' });
        response.json({ sucesso: true });
    });
});
};