const mysql = require('mysql')

const connection = mysql.createConnection({
    host:'remotemysql.com',
    user:'yourname',
    password:'yourpassword',
    database:'yourdbname'
})

connection.connect()

setInterval(keepAlive, 180000);
function keepAlive() {
    connection.query('SELECT 1');
    console.log("Fired Keep-Alive");
    return;
}

module.exports = connection