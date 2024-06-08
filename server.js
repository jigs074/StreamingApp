const express = require('express') 

const app = express()

const server = require('http').Server(app)

const io = require('socket.io')(server)

const { v4: uuidv4 } = require('uuid')
const ejs = require('ejs')

const bcrypt = require('bcryptjs'); 
const session = require('express-session'); 
const bodyParser = require('body-parser'); 
const db = require('./db'); 

console.log('Setting view engine to ejs...')
app.set('view engine', 'ejs')

console.log('View engine set successfully.')

app.use(bodyParser.urlencoded({extended: true})); 
app.use(express.static('public')); 

app.use(session({
  secret: 'secret', 
  resava: true, 
  saveUninitialized: true
})); 

app.get('/login', (req, res) => {
 res.render('login'); 
}); 


app.get('/register', (req, res) => {
 res.render('register'); 

}); 

app.post('/register' , async(req, res)=> {
    const {username , password } = req.body; 

    const hashedPassword  = await bcrypt.hash(password, 10); 

    db.query('INSERT INTO users (username, password) VALUES (?,?)', [username, hashedPassword], (error, results) => {
        if(error) {
           console.error ('Registration error: ', error); 
           res.send('Registration failed: ' + error.message);
        } else {
        res.send('Registration Successfull'); 
        }
    });
}); 

app.post('/login', async(req, res) => {
const {username, password } = req.body; 
if (username && password){
    db.query('SELECT * FROM users WHERE username = ?', [username], async(error, results)=> {
        if (error){
            res.send('Database query error'); 

        }
        else {
            const user = results[0]; 
            if(user && await bcrypt.compare(password, user.password)){
                req.session.loggedin = true; 
                req.session.username = username;
                res.redirect('/');   
            }
            else {
                res.send('Incorrect Username and Password!'); 

            }
        }
    }); 
}

}); 
app.get('/', (req, res) => {

    if (req.session.loggedin){
    res.redirect(`/${uuidv4()}`);
    }
    else {
        res.redirect('/login'); 
    }

});

app.get('/:room', (req, res) => {

    if (req.session.loggedin){
    console.log('Rendering room:', req.params.room)
    res.render('room', { roomId: req.params.room })
    }
    else {
        res.redirect('/login'); 

    }
});

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).emit('user-connected',userId)
        socket.on('disconnect' , () => {
            socket.to(roomId).emit('user-disconnected', userId)
        })
    })
})

server.listen(4000, () => {
    console.log('Server is running on port 4000');
});
