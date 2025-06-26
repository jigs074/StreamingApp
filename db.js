// const mysql = require('mysql')


// const db = mysql.createConnection({
//     host: 'localhost' ,
//     user: 'root', 
//     password: 'Jp07062004@',  
//     database: 'main'

// }); 


// db.connect((err) => {
//     if(err){
//         console.log('Error connecting to MySQL : ', err)

//     } else {
//         console.log('Connected to MySQL'); 
//     }
// }); 

// module.exports = db; 


const mysql = require('mysql')

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'Jp07062004@',  
    database: process.env.DB_NAME || 'main',
    port: process.env.DB_PORT || 3306
}); 

db.connect((err) => {
    if(err){
        console.log('Error connecting to MySQL : ', err)
    } else {
        console.log('Connected to MySQL'); 
    }
}); 

module.exports = db;