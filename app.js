// Carregar as variáveis de ambiente a partir do arquivo .env
require('dotenv').config();

// Importa o express e cria a aplicação
var app = require('./config/express')();

// Requer as rotas da aplicação
require('./app/routes/usuarios')(app);
require('./app/routes/questionario')(app);
require('./app/routes/duvidas')(app);

// Configura a conexão com o banco de dados MySQL usando variáveis de ambiente
var mysql = require('mysql');

// Função para conectar ao MySQL usando as variáveis de ambiente
var connectMYSQL = function () {
    return mysql.createConnection({
        host: process.env.DB_HOST,           // Usando a variável de ambiente para o host
        database: process.env.DB_NAME,       // Usando a variável de ambiente para o nome do banco
        user: process.env.DB_USER,           // Usando a variável de ambiente para o usuário
        password: process.env.DB_PASSWORD,   // Usando a variável de ambiente para a senha
        port: process.env.DB_PORT            // Usando a variável de ambiente para a porta
    });
}

// Teste de conexão com o banco de dados - Rota de teste para garantir a conectividade
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

// Obtém a porta do ambiente ou define 3000 como padrão
const port = process.env.PORT || 3000;  // Usa a porta fornecida pelo Render ou 3000 local

// Inicia o servidor
app.listen(port, function () {
    console.log(`Servidor Rodando na porta ${port}!`);
});
