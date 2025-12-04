var mysql = require('mysql');

var connectMYSQL = function () {
    return mysql.createConnection({
        host: 'localhost',
        database: 'girlslly',
        user: 'root',
        password: ''
    });
}

module.exports = function () {
    return connectMYSQL;
}