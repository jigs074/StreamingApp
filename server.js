
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
// const emailExistence = require ('email-existence'); 
const { Storage } = require('@google-cloud/storage'); 
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
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage: storage });

// Google Cloud Storage Setup
const gcsStorage = new Storage({
    keyFilename: path.join(__dirname,'Key.json'),
    projectId: 't-osprey-444617-u6',
});
const bucketName = 'xynq-storage-bucket';


// const sendOtpEmail = async (email, otp) => {
//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: 'Your OTP Code for Registration',
//         html: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
//     };

//     try {
//         await transporter.sendMail(mailOptions);
//         console.log('OTP email sent to:', email);
//     } catch (err) {
//         console.error('Failed to send OTP email:', err);
//         throw new Error('Email delivery failed');
//     }
// };
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

    // Initialize successMessage to null by default
    let successMessage = null;

    // Validate input
    if (!email || !otp) {
        return res.render('verify-otp', {
            email,
            errorMessage: 'Email and OTP are required.',
            successMessage,
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { // Validate email format
        return res.render('verify-otp', {
            email,
            errorMessage: 'Invalid email format.',
            successMessage,
        });
    }

    if (isNaN(otp)) { // Ensure OTP is numeric
        return res.render('verify-otp', {
            email,
            errorMessage: 'OTP must be a numeric value.',
            successMessage,
        });
    }

    // Check OTP in pendingRegistrations
    const userData = pendingRegistrations[email];

    if (!userData) {
        return res.render('verify-otp', {
            email,
            errorMessage: 'Invalid or expired OTP. Please try again.',
            successMessage,
        });
    }

    // Check OTP expiry (assuming a 10-minute validity period)
    const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
    if (Date.now() - userData.createdAt > OTP_EXPIRY_MS) {
        delete pendingRegistrations[email]; // Clean up expired entry
        return res.render('verify-otp', {
            email,
            errorMessage: 'OTP has expired. Please register again.',
            successMessage,
        });
    }


    const otpHash = crypto.createHash('sha256').update(otp.toString()).digest('hex');
    
    // Compare the hashed OTP with the stored OTP hash
    if (otpHash !== userData.otpHash) {
        return res.render('verify-otp', {
            email,
            errorMessage: 'Incorrect OTP. Please try again.',
            successMessage: null,
        });
    }

        // OTP is correct: finalize the registration
        db.query(
            'INSERT INTO users (username, email, password, profilePicture) VALUES (?, ?, ?, ?)',
            [userData.username, email, userData.hashedPassword, userData.profilePicture],
            (err) => {
                if (err) {
                    console.error('Database error:', err);
                    delete pendingRegistrations[email]; // Clean up sensitive data
                    return res.render('verify-otp', {
                        email,
                        errorMessage: 'An error occurred. Please try again later.',
                        successMessage,
                    });
                }

                // Successfully registered
                delete pendingRegistrations[email]; // Clean up temporary storage

                // Set successMessage and render the view
                successMessage = 'Registration successful! You can now log in.';
                res.render('verify-otp', {
                    email,
                    successMessage,
                    errorMessage: null, // Ensure errorMessage is cleared
                });
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
    const { username, email, password } = req.body;

    // Validate input fields
    if (!username || !email || !password) {
        return res.render('register', {
            errorMessage: 'All fields are required',
            successMessage: null,
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple email regex pattern
    if (!emailRegex.test(email)) {
        return res.render('register', {
            errorMessage: 'Invalid email format',
            successMessage: null,
        });
    }

    // Check if the email or username already exists in the database
    db.query(
        'SELECT * FROM users WHERE email = ? OR username = ?',
        [email, username],
        async (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).send('Database error');
            }

            if (results.length > 0) {
                return res.render('register', {
                    errorMessage: 'Email or username already in use',
                    successMessage: null,
                });
            }

            // Handle file upload or set a default profile picture
            let profilePictureUrl = 'https://storage.googleapis.com/xynq-storage-bucket/default-profile.png'; // Default profile picture URL

            if (req.file) {
                // Check if the uploaded file is an image
                const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedMimeTypes.includes(req.file.mimetype)) {
                    return res.render('register', {
                        errorMessage: 'Invalid file type. Please upload an image.',
                        successMessage: null,
                    });
                }
            
                try {
                    const localPath = path.join(__dirname, 'uploads', req.file.filename);
                    const gcsFileName = `profile-pictures/${Date.now()}-${req.file.filename}`;
                    
                    // Upload the image to Google Cloud Storage
                    await gcsStorage.bucket(bucketName).upload(localPath, {
                        destination: gcsFileName,
                    });
            
                    // Generate the URL for the uploaded file
                    profilePictureUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
                    
                    // Remove local file after upload
                    fs.unlinkSync(localPath);
                } catch (error) {
                    console.error('Error uploading file to Google Cloud Storage:', error);
                    return res.render('register', {
                        errorMessage: 'Failed to upload profile picture. Please try again.',
                        successMessage: null,
                    });
                }
            }
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Generate OTP and save registration details temporarily
            const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
            const otpHash = crypto.createHash('sha256').update(otp.toString()).digest('hex');
            pendingRegistrations[email] = {
                username,
                hashedPassword,
                profilePicture: profilePictureUrl,
                otpHash,
                createdAt: Date.now(),
            };

            console.log('Pending registration data:', pendingRegistrations[email]);

            // Send OTP via email (example implementation)
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
