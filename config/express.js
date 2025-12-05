var express = require('express');
var load = require('express-load');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var session = require('express-session');
var path = require('path');

module.exports = function () {
  var app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../app/views'));

  app.use(express.static(path.join(__dirname, '../app/public')));

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(expressValidator());

  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  }));

load('infra', { cwd: 'app' })
  .then('routes')
  .into(app);

  return app;
};


