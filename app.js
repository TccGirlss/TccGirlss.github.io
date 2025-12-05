app.get('/test-db', async (req, res) => {
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
