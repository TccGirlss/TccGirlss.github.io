const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { enviarEmail } = require('../infra/emailService');

const client = new OAuth2Client(
    '1065660492249-ufuke08u7lvoe65p9i2hqsb9ci021gpu.apps.googleusercontent.com'
);

const DOMINIOS_VALIDOS = [
    'gmail.com',
    'hotmail.com',
    'outlook.com',
    'yahoo.com',
    'icloud.com'
];

function dominioValido(email) {
    const partes = email.split('@');
    if (partes.length !== 2) return false;
    const dominio = partes[1].toLowerCase();
    return DOMINIOS_VALIDOS.includes(dominio);
}

module.exports = function (app) {

    function validarUsuario(req, res, next) {
        req.assert('nome', 'Nome é obrigatório!').notEmpty();
        req.assert('email', 'E-mail é obrigatório!').notEmpty();
        req.assert('senha', 'Senha é obrigatória!').notEmpty();

        const erros = req.validationErrors();
        if (erros) {
            return res.render('usuarios/registro.ejs', {
                errosValidacao: erros,
                usuario: req.body
            });
        }
        next();
    }

    app.get('/', (req, res) => {
        if (req.session.usuario) {
            return res.redirect('/inicio');
        }
        res.render('index.ejs');
    });

    app.get('/login', (req, res) => {
        res.render('usuarios/login.ejs', { erro: null });
    });

    app.post('/login', (req, res) => {
        const connection = app.infra.connectionFactory();
        const usuariosDAO = new app.infra.UsuariosDAO(connection);
        const { email, senha } = req.body;

        usuariosDAO.buscarPorEmail(email, (err, results) => {
            if (err) {
                console.error('❌ Erro ao buscar usuário no login:', err);
                return res.send('Erro ao buscar usuário!');
            }

            if (results.length === 0) {
                connection.end();
                return res.render('usuarios/login.ejs', { erro: 'Usuário não encontrado!' });
            }

            const usuario = results[0];

            bcrypt.compare(senha, usuario.senha, (err, result) => {
                if (result) {
                    req.session.usuario = usuario;
                    console.log('✅ Login bem-sucedido para:', usuario.email);

                    if (usuario.questionarioRespondido) {
                        res.redirect('/inicio');
                    } else {
                        res.redirect(`/home/comeco?usuario_id=${usuario.id}`);
                    }
                } else {
                    console.log('❌ Senha incorreta para:', usuario.email);
                    res.render('usuarios/login.ejs', { erro: 'Usuário ou senha inválidos!' });
                }
            });

            connection.end();
        });
    });

    app.get('/logout', (req, res) => {
        console.log('🔒 Usuário deslogado:', req.session.usuario?.email);
        req.session.destroy();
        res.redirect('/');
    });

    app.get('/registro', (req, res) => {
        res.render('usuarios/registro.ejs', { errosValidacao: {}, usuario: {} });
    });

    app.post('/registro', validarUsuario, (req, res) => {
        const connection = app.infra.connectionFactory();
        const usuariosDAO = new app.infra.UsuariosDAO(connection);
        const usuario = req.body;

        if (!dominioValido(usuario.email)) {
            console.warn('🚫 Tentativa de registro com domínio inválido:', usuario.email);
            return res.render('usuarios/registro.ejs', {
                errosValidacao: [{ msg: 'Domínio de e-mail não permitido!' }],
                usuario
            });
        }

        console.log('📝 Tentativa de registro para:', usuario.email);

        bcrypt.hash(usuario.senha, 12, (err, hash) => {
            if (err) {
                console.error('❌ Erro ao criptografar senha:', err);
                connection.end();
                return res.send('Erro ao processar senha!');
            }

            usuario.senha = hash;

            usuariosDAO.salvar(usuario, (err, results) => {
                if (err) {
                    console.error('❌ Erro ao salvar usuário:', err);
                    connection.end();
                    return res.send('Erro ao salvar o usuário!');
                }

                usuario.id = results.insertId;
                usuario.questionarioRespondido = 0;
                req.session.usuario = usuario;

                console.log('✅ Usuário registrado com sucesso. ID:', usuario.id);

                connection.end();
                res.redirect(`/home/comeco?usuario_id=${usuario.id}`);
            });
        });
    });

    app.post('/auth/google', async (req, res) => {
        const token = req.body.credential;
        const connection = app.infra.connectionFactory();
        const usuariosDAO = new app.infra.UsuariosDAO(connection);

        console.log('🔐 Tentativa de login com Google');

        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: '1065660492249-ufuke08u7lvoe65p9i2hqsb9ci021gpu.apps.googleusercontent.com'
            });

            const payload = ticket.getPayload();
            const email = payload.email;

            if (!dominioValido(email)) {
                console.warn('🚫 Login Google bloqueado: domínio inválido ->', email);
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Domínio de e-mail não permitido.'
                });
            }

            const nome = payload.name;
            console.log('📧 Login Google para:', email);

            usuariosDAO.buscarPorEmail(email, (err, results) => {
                if (err) {
                    console.error('❌ Erro ao buscar usuário Google:', err);
                    connection.end();
                    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar usuário' });
                }

                let usuario = results.length > 0 ? results[0] : null;

                if (!usuario) {
                    const novoUsuario = {
                        nome,
                        email,
                        senha: '',
                        questionarioRespondido: 0
                    };

                    console.log('🆕 Criando novo usuário Google:', email);

                    usuariosDAO.salvar(novoUsuario, (err, resultsInsert) => {
                        if (err) {
                            console.error('❌ Erro ao criar usuário Google:', err);
                            connection.end();
                            return res.status(500).json({ sucesso: false, mensagem: 'Erro ao criar usuário' });
                        }

                        novoUsuario.id = resultsInsert.insertId;
                        req.session.usuario = novoUsuario;
                        connection.end();

                        console.log('✅ Novo usuário Google criado. ID:', novoUsuario.id);

                        return res.status(200).json({
                            sucesso: true,
                            redirecionarPara: `/home/comeco?usuario_id=${novoUsuario.id}`
                        });
                    });
                } else {
                    req.session.usuario = usuario;
                    connection.end();

                    console.log('✅ Usuário Google encontrado. ID:', usuario.id);

                    return res.status(200).json({
                        sucesso: true,
                        redirecionarPara: usuario.questionarioRespondido
                            ? '/inicio'
                            : `/home/comeco?usuario_id=${usuario.id}`
                    });
                }
            });
        } catch (err) {
            console.error('❌ Token Google inválido:', err);
            return res.status(401).json({ sucesso: false, mensagem: 'Token inválido' });
        }
    });

    app.get('/esqueci', (req, res) => {
        res.render('usuarios/esqueci.ejs', { mensagem: null, erro: null, aviso: null });
    });

    app.post('/esqueci', (req, res) => {
        const email = req.body.email;
        const connection = app.infra.connectionFactory();
        const usuariosDAO = new app.infra.UsuariosDAO(connection);

        usuariosDAO.buscarPorEmail(email, (err, results) => {
            if (err || results.length === 0) {
                connection.end();
                return res.render('usuarios/esqueci.ejs', {
                    erro: 'E-mail não encontrado!',
                    mensagem: null,
                    aviso: null
                });
            }

            const token = crypto.randomBytes(32).toString('hex');
            const expira = new Date(Date.now() + 3600000);

            usuariosDAO.salvarTokenReset(email, token, expira, async (err2) => {
                connection.end();
                if (err2) {
                    console.error('Erro ao salvar token:', err2);
                    return res.render('usuarios/esqueci.ejs', {
                        erro: 'Erro interno. Tente novamente.',
                        mensagem: null,
                        aviso: null
                    });
                }

                const link = `http://${req.headers.host}/redefinir/${token}`;
                const html = `
          <h2>Recuperação de senha</h2>
          <p>Você solicitou redefinir sua senha. Clique abaixo:</p>
          <p><a href="${link}">Redefinir senha</a></p>
          <p>Esse link expira em 1 hora.</p>
        `;

                try {
                    await enviarEmail(email, 'Redefinição de senha - TCC App', html);
                    res.render('usuarios/esqueci.ejs', {
                        mensagem: 'E-mail enviado com instruções!',
                        erro: null
                    });
                } catch (emailErr) {
                    console.error('Erro ao enviar e-mail:', emailErr);
                    res.render('usuarios/esqueci.ejs', {
                        erro: 'Erro ao enviar e-mail.',
                        mensagem: null,
                        aviso: null
                    });
                }
            });
        });
    });

    app.get('/redefinir/:token', (req, res) => {
        const token = req.params.token;
        const connection = app.infra.connectionFactory();
        const usuariosDAO = new app.infra.UsuariosDAO(connection);

        usuariosDAO.buscarPorToken(token, (err, results) => {
            connection.end();
            if (err || results.length === 0) {
                return res.render('usuarios/redefinir.ejs', {
                    erro: 'Link inválido ou expirado!',
                    mensagem: null,
                    aviso: null,
                    token: null
                });
            }
            res.render('usuarios/redefinir.ejs', {
                token,
                erro: null,
                mensagem: null,
                aviso: null
            });
        });
    });

    app.post('/redefinir/:token', (req, res) => {
        const token = req.params.token;
        const novaSenha = req.body.senha;
        const connection = app.infra.connectionFactory();
        const usuariosDAO = new app.infra.UsuariosDAO(connection);

        usuariosDAO.buscarPorToken(token, (err, results) => {
            if (err || results.length === 0) {
                connection.end();
                return res.render('usuarios/redefinir.ejs', {
                    erro: 'Link inválido ou expirado!',
                    mensagem: null,
                    aviso: null,
                    token
                });
            }

            const usuario = results[0];
            bcrypt.hash(novaSenha, 12, (err2, hash) => {
                if (err2) {
                    connection.end();
                    return res.render('usuarios/redefinir.ejs', {
                        erro: 'Erro ao criptografar senha!',
                        mensagem: null,
                        aviso: null,
                        token
                    });
                }

                usuariosDAO.atualizarSenha(usuario.id, hash, (err3) => {
                    connection.end();
                    if (err3) {
                        return res.render('usuarios/redefinir.ejs', {
                            erro: 'Erro ao atualizar senha!',
                            mensagem: null,
                            aviso: null,
                            token
                        });
                    }

                    res.render('usuarios/redefinir.ejs', {
                        mensagem: 'Senha redefinida com sucesso! Você já pode fazer login.',
                        erro: null,
                        aviso: null,
                        token
                    });
                });
            });
        });
    });

    app.get('/inicio', (req, res) => {
        if (!req.session.usuario) {
            console.log('❌ Acesso não autorizado à /inicio');
            return res.redirect('/');
        }
        console.log('🏠 Acesso à /inicio por:', req.session.usuario.email);
        res.render('home/inicio.ejs', { usuario: req.session.usuario });
    });

    app.post('/api/questionario', function (request, response) {
        const dados = request.body;
        const connection = app.infra.connectionFactory();
        const questionarioDAO = new app.infra.QuestionarioDAO(connection);

        console.log('📋 Salvando questionário para usuário:', dados.usuario_id);

        questionarioDAO.salvarRespostas(dados, function (err, results) {
            connection.end();
            if (err) {
                console.error('❌ Erro ao salvar questionário:', err);
                return response.status(500).json({ erro: 'Erro ao salvar respostas' });
            }
            console.log('✅ Questionário salvo com sucesso. ID:', results.insertId);
            response.json({ sucesso: true });
        });
    });

    app.post('/api/marcarQuestionarioRespondido', function (request, response) {
        const usuarioId = request.body.usuario_id;
        const connection = app.infra.connectionFactory();
        const usuariosDAO = new app.infra.UsuariosDAO(connection);

        console.log('✅ Marcando questionário como respondido para usuário:', usuarioId);

        usuariosDAO.marcarQuestionarioRespondido(usuarioId, function (err, results) {
            connection.end();
            if (err) {
                console.error('❌ Erro ao marcar questionário respondido:', err);
                return response.status(500).json({ erro: 'Erro ao atualizar status' });
            }
            console.log('✅ Questionário marcado como respondido');
            response.json({ sucesso: true });
        });
    });

    app.get('/api/calendario/eventos', function (request, response) {
        if (!request.session.usuario) {
            console.log('❌ Acesso não autorizado aos eventos');
            return response.status(401).json({ erro: 'Não autorizado' });
        }

        const usuario_id = request.session.usuario.id;
        const { mes, ano } = request.query;

        console.log('📅 Buscando eventos para usuário:', usuario_id, 'Mês:', mes, 'Ano:', ano);

        const connection = app.infra.connectionFactory();
        const calendarioDAO = new app.infra.CalendarioDAO(connection);

        const dataInicio = `${ano}-${mes.padStart(2, '0')}-01`;
        const ultimoDia = new Date(ano, mes, 0).getDate();
        const dataFim = `${ano}-${mes.padStart(2, '0')}-${ultimoDia}`;

        calendarioDAO.buscarEventosPorPeriodo(usuario_id, dataInicio, dataFim, function (err, results) {
            connection.end();
            if (err) {
                console.error('❌ Erro ao buscar eventos:', err);
                return response.status(500).json({ erro: 'Erro ao buscar eventos' });
            }
            console.log('✅ Eventos encontrados:', results.length);
            response.json(results);
        });
    });

    app.post('/api/calendario/eventos', function (request, response) {
        if (!request.session.usuario) {
            console.log('❌ Acesso não autorizado para salvar evento');
            return response.status(401).json({ erro: 'Não autorizado' });
        }

        const evento = request.body;
        evento.usuario_id = request.session.usuario.id;

        console.log('➕ Salvando evento para usuário:', evento.usuario_id, 'Tipo:', evento.tipo);

        const connection = app.infra.connectionFactory();
        const calendarioDAO = new app.infra.CalendarioDAO(connection);
        const questionarioDAO = new app.infra.QuestionarioDAO(connection);

        questionarioDAO.buscarPorUsuarioId(evento.usuario_id, function (err, questionarioResults) {
            if (err) {
                console.error('❌ Erro ao buscar questionário para evento:', err);
                connection.end();
                return response.status(500).json({ erro: 'Erro ao buscar informações do questionário' });
            }

            if (questionarioResults.length > 0 && evento.tipo === 'menstruacao') {
                const questionario = questionarioResults[0];
                evento.duracao_menstruacao = questionario.duracao_menstruacao || 5;

                const dataInicio = new Date(evento.data_inicio);
                const dataFim = new Date(dataInicio);
                dataFim.setDate(dataFim.getDate() + (evento.duracao_menstruacao - 1));
                evento.data_fim = dataFim.toISOString().split('T')[0];
            }

            calendarioDAO.salvarEvento(evento, function (err, results) {
                if (err) {
                    console.error('❌ Erro ao salvar evento:', err);
                    connection.end();
                    return response.status(500).json({ erro: 'Erro ao salvar evento' });
                }

                console.log('✅ Evento salvo com sucesso. ID:', results.insertId);

                if (evento.tipo === 'menstruacao' && questionarioResults.length > 0 && questionarioResults[0].ciclo_regular) {
                    criarPrevisoesFuturas(evento, questionarioResults[0].duracao_ciclo || 28, evento.usuario_id, connection);
                } else {
                    connection.end();
                }

                response.json({ sucesso: true, id: results.insertId });
            });
        });
    });

    function criarPrevisoesFuturas(eventoBase, duracaoCiclo, usuario_id, mainConnection) {
        const connection = mainConnection || app.infra.connectionFactory();
        const calendarioDAO = new app.infra.CalendarioDAO(connection);

        console.log('🔮 Criando previsões futuras para usuário:', usuario_id);

        const promises = [];

        for (let i = 1; i <= 6; i++) {
            const dataInicioPrevisao = new Date(eventoBase.data_inicio);
            dataInicioPrevisao.setDate(dataInicioPrevisao.getDate() + duracaoCiclo * i);

            const dataFimPrevisao = new Date(dataInicioPrevisao);
            dataFimPrevisao.setDate(dataFimPrevisao.getDate() + (eventoBase.duracao_menstruacao - 1));

            const previsao = {
                usuario_id,
                tipo: 'menstruacao',
                data_inicio: dataInicioPrevisao.toISOString().split('T')[0],
                data_fim: dataFimPrevisao.toISOString().split('T')[0],
                sintomas: 'Previsão',
                medicamentos: '',
                duracao_menstruacao: eventoBase.duracao_menstruacao,
                cor: 'previsao'
            };

            const promise = new Promise((resolve) => {
                calendarioDAO.salvarEvento(previsao, function (err) {
                    if (err) {
                        console.error('❌ Erro ao criar previsão:', err);
                    } else {
                        console.log('✅ Previsão criada para:', previsao.data_inicio);
                    }
                    resolve();
                });
            });

            promises.push(promise);
        }

        Promise.all(promises).then(() => {
            if (!mainConnection) {
                connection.end();
            }
            console.log('✅ Todas as previsões criadas com sucesso');
        });
    }

    app.get('/api/usuario/perfil', function (request, response) {
        if (!request.session.usuario) {
            console.log('❌ Acesso não autorizado ao perfil');
            return response.status(401).json({ success: false, message: 'Não autorizado' });
        }

        const usuarioId = request.session.usuario.id;
        console.log('👤 Buscando perfil do usuário:', usuarioId);

        const connection = app.infra.connectionFactory();
        const usuariosDAO = new app.infra.UsuariosDAO(connection);
        const questionarioDAO = new app.infra.QuestionarioDAO(connection);

        usuariosDAO.buscarPorId(usuarioId, function (err, usuarioResults) {
            if (err) {
                console.error('❌ Erro ao buscar usuário:', err);
                connection.end();
                return response.status(500).json({ success: false, message: 'Erro ao buscar usuário' });
            }

            if (usuarioResults.length === 0) {
                console.log('❌ Usuário não encontrado:', usuarioId);
                connection.end();
                return response.status(404).json({ success: false, message: 'Usuário não encontrado' });
            }

            const usuario = usuarioResults[0];
            console.log('✅ Usuário encontrado:', usuario.email);

            questionarioDAO.buscarPorUsuarioId(usuarioId, function (err, questionarioResults) {
                connection.end();

                if (err) {
                    console.error('❌ Erro ao buscar questionário:', err);
                    return response.status(500).json({ success: false, message: 'Erro ao buscar questionário' });
                }

                console.log('✅ Questionários encontrados:', questionarioResults.length);

                response.json({
                    success: true,
                    usuario: {
                        id: usuario.id,
                        nome: usuario.nome,
                        email: usuario.email,
                        telefone: usuario.telefone || '',
                        questionario: questionarioResults.length > 0 ? questionarioResults[0] : null
                    }
                });
            });
        });
    });

    app.post('/api/usuario/atualizar-perfil', function (request, response) {
        if (!request.session.usuario) {
            console.log('❌ Erro: Usuário não autenticado na atualização de perfil');
            return response.status(401).json({ success: false, message: 'Não autorizado' });
        }

        console.log('🔧 INICIANDO ATUALIZAÇÃO DE PERFIL ======================');
        console.log('👤 Usuário da sessão:', request.session.usuario.id, request.session.usuario.email);

        const connection = app.infra.connectionFactory();
        const usuariosDAO = new app.infra.UsuariosDAO(connection);
        const questionarioDAO = new app.infra.QuestionarioDAO(connection);

        const usuarioId = request.session.usuario.id;
        const dados = request.body;

        console.log('📦 DADOS RECEBIDOS DA REQUISIÇÃO:');
        console.log(JSON.stringify(dados, null, 2));
        console.log('👤 ID do usuário para atualização:', usuarioId);

        if (!dados.nome || !dados.email) {
            connection.end();
            console.log('❌ Dados obrigatórios faltando: nome ou email');
            return response.status(400).json({
                success: false,
                message: 'Nome e email são obrigatórios'
            });
        }

        const updateUsuario = {
            nome: dados.nome,
            email: dados.email,
            telefone: dados.telefone || ''
        };

        console.log('🔄 DADOS DO USUÁRIO PARA ATUALIZAÇÃO:', updateUsuario);

        function atualizarUsuario() {
            console.log('📝 EXECUTANDO ATUALIZAÇÃO DO USUÁRIO NO BANCO...');

            usuariosDAO.atualizar(usuarioId, updateUsuario, function (err, result) {
                if (err) {
                    connection.end();
                    console.error('❌ ERRO CRÍTICO AO ATUALIZAR USUÁRIO:');
                    console.error('🔍 Mensagem do erro:', err.message);
                    console.error('🔍 Código do erro:', err.code);
                    console.error('🔍 SQL Message:', err.sqlMessage);
                    console.error('🔍 SQL:', err.sql);

                    return response.status(500).json({
                        success: false,
                        message: 'Erro ao atualizar usuário no banco de dados',
                        error: err.message,
                        sqlMessage: err.sqlMessage
                    });
                }

                console.log('✅ USUÁRIO ATUALIZADO COM SUCESSO!');
                console.log('📊 Linhas afetadas no banco:', result.affectedRows);
                console.log('🔍 Resultado completo:', result);

                atualizarQuestionario();
            });
        }

        function atualizarQuestionario() {
            console.log('📊 BUSCANDO QUESTIONÁRIO EXISTENTE...');

            questionarioDAO.buscarPorUsuarioId(usuarioId, function (err, questionarioResults) {
                if (err) {
                    connection.end();
                    console.error('❌ Erro ao buscar questionário:', err);
                    return response.status(500).json({
                        success: false,
                        message: 'Erro ao buscar questionário: ' + err.message
                    });
                }

                console.log('📋 Questionários encontrados:', questionarioResults.length);

                const dadosQuestionario = {
                faixa_etaria: dados.faixa_etaria || null,
                peso: dados.peso ? parseFloat(dados.peso) : null,
                altura: dados.altura ? parseFloat(dados.altura) : null,
                menarca: dados.menarca ? parseInt(dados.menarca) : null,
                ciclo_regular:
                    dados.ciclo_regular === true || dados.ciclo_regular === 'true' ? 1 :
                    dados.ciclo_regular === false || dados.ciclo_regular === 'false' ? 0 : null,
                duracao_menstruacao: dados.duracao_menstruacao || null,
                intensidade_fluxo: dados.intensidade_fluxo || null,
                usa_anticoncepcional:
                    dados.usa_anticoncepcional === true || dados.usa_anticoncepcional === 'true' ? 1 :
                    dados.usa_anticoncepcional === false || dados.usa_anticoncepcional === 'false' ? 0 : null
                };


                console.log('📋 DADOS DO QUESTIONÁRIO PARA PROCESSAMENTO:');
                console.log(JSON.stringify(dadosQuestionario, null, 2));

                if (questionarioResults.length > 0) {
                    const questionarioId = questionarioResults[0].id;
                    console.log('🔄 ATUALIZANDO QUESTIONÁRIO EXISTENTE ID:', questionarioId);
console.log('🧩 VALORES FINAIS DO QUESTIONÁRIO PARA O SQL:');
console.table(dadosQuestionario);


                    questionarioDAO.atualizar(questionarioId, dadosQuestionario, function (err, result) {
                        connection.end();
                        if (err) {
                            console.error('❌ Erro ao atualizar questionário:', err);
                            console.error('🔍 Detalhes do erro:', err.sqlMessage || err.message);
                            return response.status(500).json({
                                success: false,
                                message: 'Erro ao atualizar questionário: ' + (err.sqlMessage || err.message)
                            });
                        }

                        console.log('✅ QUESTIONÁRIO ATUALIZADO COM SUCESSO!');
                        console.log('📊 Linhas afetadas:', result.affectedRows);
                        response.json({
                            success: true,
                            message: 'Perfil atualizado com sucesso'
                        });
                    });
                } else {
                    console.log('🆕 CRIANDO NOVO QUESTIONÁRIO...');
                    dadosQuestionario.usuario_id = usuarioId;

                    questionarioDAO.salvarRespostas(dadosQuestionario, function (err, result) {
                        connection.end();
                        if (err) {
                            console.error('❌ Erro ao criar questionário:', err);
                            console.error('🔍 Detalhes do erro:', err.sqlMessage || err.message);
                            return response.status(500).json({
                                success: false,
                                message: 'Erro ao criar questionário: ' + (err.sqlMessage || err.message)
                            });
                        }

                        console.log('✅ QUESTIONÁRIO CRIADO COM SUCESSO!');
                        console.log('🆔 ID do novo questionário:', result.insertId);
                        response.json({
                            success: true,
                            message: 'Perfil atualizado com sucesso'
                        });
                    });
                }
            });
        }

        console.log('🎯 INICIANDO LÓGICA PRINCIPAL DE ATUALIZAÇÃO...');

        if (dados.senha && dados.senha.length >= 6) {
            console.log('🔐 ATUALIZANDO COM NOVA SENHA...');
            console.log('📏 Tamanho da senha:', dados.senha.length);

            bcrypt.hash(dados.senha, 12, function (err, hash) {
                if (err) {
                    connection.end();
                    console.error('❌ Erro ao criptografar senha:', err);
                    return response.status(500).json({
                        success: false,
                        message: 'Erro ao criptografar senha: ' + err.message
                    });
                }

                updateUsuario.senha = hash;
                console.log('🔑 Senha criptografada com sucesso');
                atualizarUsuario();
            });
        } else {
            console.log('🔓 ATUALIZANDO SEM ALTERAR SENHA...');
            atualizarUsuario();
        }
    });

    app.get('/api/teste-conexao', function (request, response) {
        console.log('🧪 TESTANDO CONEXÃO COM O BANCO...');

        const connection = app.infra.connectionFactory();
        const usuariosDAO = new app.infra.UsuariosDAO(connection);

        usuariosDAO.buscarPorId(1, function (err, results) {
            connection.end();
            if (err) {
                console.error('❌ ERRO DE CONEXÃO COM O BANCO:');
                console.error('🔍 Detalhes:', err.message);
                console.error('🔍 Código:', err.code);
                response.status(500).json({
                    success: false,
                    error: 'Erro de conexão com o banco',
                    details: err.message,
                    code: err.code
                });
            } else {
                console.log('✅ CONEXÃO COM BANCO OK!');
                console.log('📊 Usuários encontrados:', results.length);
                response.json({
                    success: true,
                    message: 'Conexão OK',
                    usuarios: results.length,
                    exemplo: results[0]
                });
            }
        });
    });

    app.delete('/api/calendario/eventos/:id', function (request, response) {
        if (!request.session.usuario) {
            console.log('❌ Acesso não autorizado para remover evento');
            return response.status(401).json({ erro: 'Não autorizado' });
        }

        const evento_id = request.params.id;
        const usuario_id = request.session.usuario.id;

        console.log('🗑️ Removendo evento:', evento_id, 'do usuário:', usuario_id);

        const connection = app.infra.connectionFactory();
        const calendarioDAO = new app.infra.CalendarioDAO(connection);

        calendarioDAO.removerEvento(evento_id, usuario_id, function (err, results) {
            connection.end();
            if (err) {
                console.error('❌ Erro ao remover evento:', err);
                return response.status(500).json({ erro: 'Erro ao remover evento' });
            }

            if (results.affectedRows === 0) {
                console.log('⚠️ Evento não encontrado ou não pertence ao usuário');
                return response.status(404).json({ erro: 'Evento não encontrado' });
            }

            console.log('✅ Evento removido com sucesso');
            response.json({ sucesso: true, message: 'Evento removido com sucesso' });
        });
    });

    app.get('/api/usuario/info', function (request, response) {
        if (!request.session.usuario) {
            console.log('❌ Acesso não autorizado às informações do usuário');
            return response.status(401).json({ erro: 'Não autorizado' });
        }

        console.log('ℹ️ Fornecendo informações do usuário:', request.session.usuario.email);

        response.json({
            nome: request.session.usuario.nome,
            email: request.session.usuario.email
        });
    });
};