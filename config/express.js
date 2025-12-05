var express = require('express');
var load = require('express-load');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var session = require('express-session');
var path = require('path');

module.exports = function () {
  var app = express();

  // View engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../app/views'));

  // Arquivos estáticos
  app.use(express.static(path.join(__dirname, '../app/public')));

  // Body Parser
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.json());

  // Validator
  app.use(expressValidator());

  // Session usando variável de ambiente
  app.use(session({
    secret: process.env.SESSION_SECRET, // ← vem do .env carregado no app.js
    resave: false,
    saveUninitialized: false
  }));

  // Carregar rotas e infraestrutura
  load('routes', { cwd: 'app' })
    .then('infra')
    .into(app);

  return app;
};
