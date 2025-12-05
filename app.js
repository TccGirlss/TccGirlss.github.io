// Carregar variáveis do .env
require('dotenv').config();

// Importa o express e cria a aplicação
var app = require('./config/express')();

// Rotas
require('./app/routes/usuarios')(app);
require('./app/routes/questionario')(app);
require('./app/routes/duvidas')(app);

// MySQL
var mysql = require('mysql');

// Função para conectar ao MySQL (Railway)
var connectMYSQL = function () {
    return mysql.createConnection({
        host: process.env.MYSQLHOST,
        database: process.env.MYSQLDATABASE,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        port: process.env.MYSQLPORT
    });
};

// Rota de teste → para ver se o Railway está conectando
app.get('/test-db', (req, res) => {
    const connection = connectMYSQL();

    connection.query('SELECT 1', (err, results) => {
        if (err) {
            console.error('Erro na conexão com o banco de dados:', err.stack);
            return res.status(500).json({ error: 'Erro na conexão com o banco de dados' });
        }
        res.send('Conexão com o banco de dados bem-sucedida!');
    });

    connection.end();
});

// Porta (Render usa process.env.PORT)
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Servidor Rodando na porta ${port}!`);
});

