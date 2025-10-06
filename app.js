var app = require('./config/express')();

// importa as rotas
require('./app/routes/usuarios')(app);
require('./app/routes/questionario')(app); // 👈 adiciona esta linha

app.listen(3000, function() {
    console.log('Servidor Rodando!');
});
