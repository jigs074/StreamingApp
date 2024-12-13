
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
const profileRoutes = require('./profileRoutes');
const friendsRoute = require('./friendsRoute'); 
console.log('Setting view engine to ejs...');
app.set('view engine', 'ejs');
console.log('View engine set successfully.');
const emailExistence = require ('email-existence'); 
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
let pendingRegistrations = {}; 
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
 

app.use(profileRoutes);  
app.use(friendsRoute); 
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

// Verify OTP route
app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
        return res.render('verify-otp', {
            email,
            errorMessage: 'Email and OTP are required',
            successMessage: null
        });
    }

    // Check OTP in pendingRegistrations
    const userData = pendingRegistrations[email];
    if (!userData) {
        return res.render('verify-otp', {
            email,
            errorMessage: 'Invalid or expired OTP. Please try again.',
            successMessage: null
        });
    }

    if (parseInt(otp) !== userData.otp) {
        return res.render('verify-otp', {
            email,
            errorMessage: 'Incorrect OTP. Please try again.',
            successMessage: null
        });
    }

    // OTP is correct: finalize the registration
    db.query(
        'INSERT INTO users (username, email, password, profilePicture) VALUES (?, ?, ?, ?)',
        [userData.username, email, userData.hashedPassword, userData.profilePicture],
        (err) => {
            if (err) {
                console.error('Database error:', err);
                return res.render('verify-otp', {
                    email,
                    errorMessage: 'An error occurred. Please try again later.',
                    successMessage: null
                });
            }

            // Successfully registered
            delete pendingRegistrations[email]; // Clean up temporary storage

            // Redirect to the login page
            res.redirect('/login');
        }
    );
});






app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

app.get('/verify-otp', (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).send('Email is required');
    }

    // Pass the email and optional messages (if any) to the EJS template
    res.render('verify-otp', {
        email,
        errorMessage: null,  // No error by default
        successMessage: null // No success by default
    });
});


app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', upload.single('profilePicture'), async (req, res) => {
    const { username, password, email } = req.body;
    const profilePicture = req.file ? req.file.filename : 'default-profile.png';

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Invalid email format');
    }

    // Check email existence via SMTP (using email-existence module)
    

        // Check if the email or username already exists in the database
        db.query(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username],
            async (error, results) => {
                if (error) return res.status(500).send('Database error');
                if (results.length > 0) {
                    return res.status(400).send('Email or username already in use');
                }

                // Generate a hashed password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Generate a random OTP (6 digits)
                const otp = crypto.randomInt(100000, 999999);

                // Save the pending user in temporary storage (pendingRegistrations)
                pendingRegistrations[email] = {
                    username,
                    hashedPassword,
                    profilePicture,
                    otp,
                    createdAt: Date.now()
                };

                // Send the OTP via email using the pre-defined transporter
                const mailOptions = {
                    from: process.env.EMAIL_USER,  // Use environment variable for email user
                    to: email,
                    subject: 'Your OTP for Registration',
                    html: `<p>Hello <strong>${username}</strong>,</p>
        <p>Thank you for registering with our <strong>Zync</strong>. Your One-Time Password (OTP) is:</p>
        <h2 style="color: #007bff;">${otp}</h2>
        <p>This OTP is valid for <strong>10 minutes</strong>. Please enter it on the verification page to complete your registration.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br>
        <p>Best regards,</p>
        <p><strong>The Zync Team</strong></p>`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending OTP:', error);
                        return res.status(500).send('Failed to send OTP');
                    }
                    res.redirect(`/verify-otp?email=${email}`);
                
                });
            }
        );
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

server.listen(5000, () => {
    console.log('Server is running on port 5000');

});
