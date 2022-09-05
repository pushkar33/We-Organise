// Importing mysql package 
var mysql = require("mysql");

// -------------------------Configuring Database--------------------------------------------

var dbconfig = {
    host: "localhost",
    user: "root",
    password: "",
    database: "nodejs"
}

// ------------------------Creating Connection-------------------------------------------

var dbcon = mysql.createConnection(dbconfig);

dbcon.connect(function (err) {
    if (err)
        console.log(err.message);
    else
        console.log("Connected...Badhai HO...");
})

module.exports=dbcon;