module.exports = function (app) {
    app.get('/', function (request, response) {
        response.render('home/index.ejs', { usuario: request.session.usuario });
    });

    app.get('/biblioteca.ejs', (req, res) => {
        if (!req.session.usuario) {
            return res.redirect('/login');
        }
        res.render('home/biblioteca.ejs', { usuario: req.session.usuario });
    });
}