var app = require('./config/express')();
require('./app/routes/usuarios')(app);

app.listen(3000, function(){
    console.log('Servidor Rodando!');
});
