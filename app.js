require('dotenv').config();

const express = require('./config/express')();
const connectMYSQL = require('./app/infra/connectionFactory');

require('./app/routes/usuarios')(express);
require('./app/routes/questionario')(express);
require('./app/routes/duvidas')(express);

express.get('/test-db', (req, res) => {
  const connection = connectMYSQL();

  connection.connect(err => {
    if (err) {
      console.error('Erro na conexão com o banco de dados:', err);
      return res.status(500).json({ error: 'Erro na conexão com o banco de dados', details: err });
    }
    res.json({ success: 'Conexão com o banco de dados bem-sucedida!' });
  });

  connection.end();
});

const port = process.env.PORT || 3000;
express.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}!`);
});

