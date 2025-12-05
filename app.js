// Carregar variáveis do .env
require('dotenv').config();

// Importa o express e cria a aplicação
var app = require('./config/express')();

// Rotas existentes
require('./app/routes/usuarios')(app);
require('./app/routes/questionario')(app);
require('./app/routes/duvidas')(app);

// ROTA DE TESTE PARA O BANCO
app.get('/test-db', (req, res) => {
    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port: process.env.MYSQLPORT
    });

    connection.connect(err => {
        if (err) {
            console.error('Erro na conexão com o banco de dados:', err);
            return res.status(500).json({ error: 'Erro na conexão com o banco de dados', details: err });
        }
        res.json({ success: 'Conexão com o banco de dados bem-sucedida!' });
    });

    connection.end();
});

// MySQL (opcional, se usado em DAO)
// ...

// Porta (Render usa process.env.PORT)
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor Rodando na porta ${port}!`);
});
