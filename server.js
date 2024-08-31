
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidv4 } = require('uuid');
const ejs = require('ejs');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

console.log('Setting view engine to ejs...');
app.set('view engine', 'ejs');
console.log('View engine set successfully.');

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

require('dotenv').config({ path: './EmailCreds.env' });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

app.post('/forgot-password', (req, res) => {
    const { username } = req.body;

    db.query('SELECT email FROM users WHERE username = ?', [username], (err, results) => {
        if (err || results.length === 0) {
            res.send('Error: User not found');
        } else {
            const email = results[0].email;
            const otp = crypto.randomInt(100000, 999999).toString();

            db.query('UPDATE users SET otp = ? WHERE username = ?', [otp, username], (err, result) => {
                if (err) {
                    res.send('Error sending OTP');
                } else {
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: 'Your OTP for password reset',
                        text: `Your OTP is ${otp}`
                    };

                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
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
            res.send('Error verifying OTP');
        } else if (results.length > 0 && results[0].otp === otp) {
            res.render('reset-password', { username });
        } else {
            res.send('Invalid OTP');
        }
    });
});

app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

app.get('/verify-otp', (req, res) => {
    res.render('verify-otp');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', upload.single('profilePicture'), async (req, res) => {
    console.log('Uploaded file: ', req.file);  

    const { username, password, email } = req.body;
    const profilePicture = req.file ? req.file.filename : 'default-profile.png';

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO users (username, password, email, profilePicture) VALUES (?,?,?,?)', [username, hashedPassword, email, profilePicture], (error, results) => {
        if (error) {
            res.send('Registration failed: ' + error.message);
        } else {
            res.send('Registration Successful');
        }
    });
});

app.post('/reset-password', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username], (err) => {
        if (err) {
            res.send('Error resetting password');
        } else {
            res.send('Password has been reset successfully');
        }
    });
});

app.post('/enter-room', (req, res) => {
    const { roomId } = req.body;

    if (req.session.loggedin) {
        if (io.sockets.adapter.rooms.has(roomId)) {
            const username = req.session.username;
            res.status(200).json({ redirectUrl: `/${roomId}?username=${username}` });
        } else {
            res.status(400).json({ message: 'Room Id does not exist' });
        }
    } else {
        res.status(401).json({ redirectUrl: `/login` });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (username && password) {
        db.query('SELECT * FROM users WHERE username = ?', [username], async (error, results) => {
            if (error) {
                res.send('Database query error');
            } else {
                const user = results[0];
                if (user && await bcrypt.compare(password, user.password)) {
                    req.session.loggedin = true;
                    req.session.username = username;
                    res.redirect('/');
                } else {
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
            res.status(400).json({ message: 'Room Id already in use.' });
        } else {
            io.sockets.emit('create-room', customRoomId);
            res.status(200).json({ redirectUrl: `/${customRoomId}?username=${req.session.username}` });
        }
    } else {
        res.status(401).json({ message: 'Not logged in' });
    }
});

app.get('/', (req, res) => {
    if (req.session.loggedin) {
        const username = req.session.username;

        // Query to get profile picture from the database
        db.query('SELECT profilePicture FROM users WHERE username = ?', [username], (error, results) => {
            if (error) {
                console.error('Database query error:', error);
                res.send('Error loading profile picture');
            } else {
                const profilePicture = results[0]?.profilePicture || 'default-profile.png';
                res.render('dashboard', { username, profilePicture });
            }
        });
    } else {
        res.redirect('/login');
    }
});


app.get('/:room', (req, res) => {
    if (req.session.loggedin) {
        const username = req.query.username || req.session.username;
        res.render('room', { roomId: req.params.room, username: username });
    } else {
        res.redirect('/login');
    }
});



// Send a friend request 

app.post('/send-friend-request', (req, res) => {
  const {userId, friendId } = req.body; 

  db.query('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, "pending")', [userId, friendId], (err, result) => {
    if (err) {
        return res.status(500).send('Error sending friend request');
    }
    res.send('Friend request sent');
}); 
}); 

// Accept a freind request


app.post('/accept-friend-request', (req, res) => {
    const {userId, friendId} = req.body; 
    db.query('UPDATE friends SET status = "accepted" WHERE user_id = ? AND friend_id = ?', [friendId, userId], (err, result) => {
        if (err) {
            return res.status(500).send('Error accepting friend request');
        }
        res.send('Friend request accepted');
    });

});

app.post('/reject-friend-request', (req, res) => {
    const { userId, friendId } = req.body;

    db.query('UPDATE friends SET status = "rejected" WHERE user_id = ? AND friend_id = ?', [friendId, userId], (err, result) => {
        if (err) {
            return res.status(500).send('Error rejecting friend request');
        }
        res.send('Friend request rejected');
    });
});

app.get('/friends/:userId', (req, res) => {
    const userId = req.params.userId;

    db.query('SELECT users.id, users.username, friends.status FROM friends JOIN users ON (friends.friend_id = users.id) WHERE friends.user_id = ? AND friends.status = "accepted"', [userId], (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching friends');
        }
        res.json(results);
    });
});



io.on('connection', socket => {
    console.log('New connection:', socket.id);

    socket.on('join-room', (roomId, username) => {
        console.log(`User ${username} joined room ${roomId}`);
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', username);

        socket.on('disconnect', () => {
            console.log(`User ${username} disconnected`);
            socket.to(roomId).emit('user-disconnected', username);
        });

        socket.on('chat-message', (msg) => {
            io.to(roomId).emit('chat-message', msg);
        });
    });
});

server.listen(4000, () => {
    console.log('Server is running on port 4000');
});
