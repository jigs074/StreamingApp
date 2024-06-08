const mysql = require('mysql')


const db = mysql.createConnection({
    host: 'localhost' ,
    user: 'root', 
    password: 'Jp07062004@',  
    database: 'Authentication'

}); 


db.connect((err) => {
    if(err){
        console.log('Error connecting to MySQL : ', err)

    } else {
        console.log('Connected to MySQL'); 
    }
}); 

module.exports = db; 