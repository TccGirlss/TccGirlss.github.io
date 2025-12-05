var mysql = require('mysql');

var connectMYSQL = function () {
    return mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port: process.env.MYSQLPORT
    });
}

module.exports = function () {
    return connectMYSQL();
}

