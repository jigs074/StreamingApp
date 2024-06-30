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
const http = require('http'); 


console.log('Setting view engine to ejs...')
app.set('view engine', 'ejs')

console.log('View engine set successfully.')

app.use(bodyParser.urlencoded({extended: true})); 
app.use(express.static('public')); 
app.use(bodyParser.json()); 
app.use(session({
  secret: 'secret', 
  resava: true, 
  saveUninitialized: true
})); 
require('dotenv').config({path: './EmailCreds.env'});
const nodemailer = require('nodemailer'); 
const crypto = require('crypto'); 

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);


const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
}); 

app.post('/forgot-password', (req, res) => {
    console.log('Request body: ', req.body);
     // Debugging log 
     const { username } = req.body;
     console.log('Username: ', username); 

    db.query('SELECT email FROM users WHERE username = ?', [username], (err, results) => {
        if (err || results.length === 0) {
            console.error('Error fetching email:', err);
            res.send('Error: User not found');
        } else {
            const email = results[0].email;

            // Generate a 6-digit OTP
            const otp = crypto.randomInt(100000, 999999).toString();

            // Save OTP in database
            db.query('UPDATE users SET otp = ? WHERE username = ?', [otp, username], (err, result) => {
                if (err) {
                    console.error('Error updating OTP:', err);
                    res.send('Error sending OTP');
                } else {
                    // Send OTP email
                    const mailOptions = {
                        from: 'your-email@gmail.com',
                        to: email,
                        subject: 'Your OTP for password reset',
                        text: `Your OTP is ${otp}`
                    };

                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            console.error('Error sending email:', err);
                            res.send('Error sending OTP');
                        } else {
                            
                            res.redirect('/verify-otp'); 
                        }
                    });
                }
            });
        }
    });
});


app.post('/verify-otp', (req, res) => {
    const { username, otp } = req.body;

    db.query('SELECT otp FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Error retrieving OTP:', err);
            res.send('Error verifying OTP');
        } else if (results.length > 0 && results[0].otp === otp) {
            // OTP is correct, proceed to reset password
            res.render('reset-password', {username});
        } else {
            res.send('Invalid OTP');
        }
    })
});







app.get ('/forgot-password', (req , res) =>{
     res.render('forgot-password'); 
}); 

app.get('/verify-otp', (req, res)=> {
   res.render('verify-otp'); 
}); 
app.get('/login', (req, res) => {
 res.render('login'); 
}); 


app.get('/register', (req, res) => {
 res.render('register'); 

}); 

app.post('/register' , async(req, res)=> {
    const {username , password, email } = req.body; 
    console.log('Register request body: ', req.body); 

    const hashedPassword  = await bcrypt.hash(password, 10); 
    console.log('Hashed Password: ', hashedPassword); 

    db.query('INSERT INTO users (username, password, email) VALUES (?,?,?)', [username, hashedPassword,email], (error, results) => {
        if(error) {
           console.error ('Registration error: ', error); 
           res.send('Registration failed: ' + error.message);
        } else {
        res.send('Registration Successfull'); 
        }
    });
}); 

app.post('/reset-password', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username], (err) => {
        if (err) {
            console.error('Error updating password:', err);
            res.send('Error resetting password');
        } else {
            res.send('Password has been reset successfully');
        }
    });
});

app.post('/enter-room', (req,res) => {
  const { roomId } = req.body; 
  
  if(req.session.loggedin) {
    if (io.sockets.adapter.rooms.has(roomId)){
        res.status(200).json({redirectUrl:`/${roomId}`});

    }
    else {
         res.status(400).json({message: 'Room Id does not exist'}); 
       
    }
   } 
  else {
    res.status(401).json({redirectUrl: `/${login}` }); 
  }
}); 

app.post('/login', async(req, res) => {
const {username, password } = req.body; 
console.log('Login request body: ', req.body); 

if (username && password){
    db.query('SELECT * FROM users WHERE username = ?', [username], async(error, results)=> {
        if (error){
            res.send('Database query error'); 

        }
        else {
            console.log('User data retrieved: ', results); 
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

app.post('/create-room', (req, res) => {
    const { customRoomId } = req.body;
    if (req.session.loggedin) {
      if (io.sockets.adapter.rooms.has(customRoomId)) {
        res.status(400).json({message: 'Room Id already in use. '}); 
      } else {
        io.sockets.emit('create-room', customRoomId); 

        res.status(200).json({ redirectUrl: `/${customRoomId}` });
      }
    } else {
        res.status(401).json({ message: 'Not logged in' });
    }
  });

app.get('/', (req, res) => {

    if (req.session.loggedin){ 
    res.render('dashboard', {username: req.session.username });
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

        socket.on('chat-message', (msg) => {
            console.log(`Message received from user ${userId} in room ${roomId}: ${msg}`);
            // Broadcast the message to everyone in the room 
            
            io.to(roomId).emit('chat message', msg); 
            
        })
    })
})

server.listen(4000, () => {
    console.log('Server is running on port 4000');
});
