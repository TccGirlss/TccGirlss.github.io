var app = require('./config/express')();

require('./app/routes/usuarios')(app);
require('./app/routes/questionario')(app);
require('./app/routes/duvidas')(app);

app.listen(3000, function () {
    console.log('Servidor Rodando!');
});