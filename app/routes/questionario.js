module.exports = function(app) {
    app.get('/home/comeco', (req, res) => {
        const usuario_id = req.query.usuario_id;
        if (!req.session.usuario) {
            return res.redirect('/login');
        }

        res.render('home/comeco.ejs', { usuario_id });
    });
};
