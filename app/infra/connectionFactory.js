var mysql = require('mysql2');

module.exports = function() {
  return function() {
      return mysql.createConnection({
          host: process.env.MYSQLHOST,
          user: process.env.MYSQLUSER,
          password: process.env.MYSQLPASSWORD,
          database: process.env.MYSQLDATABASE,
          port: process.env.MYSQLPORT
      });
  };
}

