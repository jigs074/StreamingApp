
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidv4 } = require('uuid');

const cookieParser = require('cookie-parser'); 
app.use(cookieParser()); 
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
const InterviewRoutes = require('./InterviewRoutes'); 
const profileRoutes = require('./profileRoutes');
const friendsRoute = require('./friendsRoute'); 
console.log('Setting view engine to ejs...');
app.set('view engine', 'ejs');
console.log('View engine set successfully.');
// const emailExistence = require ('email-existence'); 
const { Storage } = require('@google-cloud/storage');

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const jwt = require('jsonwebtoken'); 

const authenticateToken = require('./authenticateToken'); 

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
require('dotenv').config();
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

app.use(InterviewRoutes); 
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
app.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    const registration = pendingRegistrations[email];
    if (!registration) {
        return res.status(400).send({ error: 'No pending registration found for this email.' });
    }

    // Check if OTP matches the hash
    const otpHash = crypto.createHash('sha256').update(otp.toString()).digest('hex');
    if (otpHash !== registration.otpHash) {
        return res.status(400).send({ error: 'Invalid OTP.' });
    }

    if (registration.type === 'candidate') {
        // Register candidate
        const { email, password, firstName, lastName } = registration.registerationData;

        // Insert candidate into the database
        db.query(
            'INSERT INTO candidates (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
            [email, password, firstName, lastName],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).send({ error: 'This email is already registered as a candidate.' });
                    }
                    console.error('Error registering candidate:', err);
                    return res.status(500).send({ error: 'Failed to register candidate.' });
                }

                // Candidate registered, now update interviews table with candidate_id
                const candidateId = result.insertId;

                // Update interviews table
                db.query(
                    'UPDATE interviews SET candidate_id = ? WHERE candidate_email = ?',
                    [candidateId, email],
                    (err, updateResult) => {
                        if (err) {
                            console.error('Error updating interviews table:', err);
                            return res.status(500).send({ error: 'Failed to update interviews table.' });
                        }

                        // Remove pending registration
                        delete pendingRegistrations[email];

                        res.status(200).send({ message: 'Candidate registered and interviews table updated successfully.' });
                    }
                );
            }
        );
    } else if (registration.type === 'interviewer') {
        // Interviewer registration logic (same as your original code)
        const companyName = registration.registerationData.company;
        console.log('Interviewer Registration Data:', registration.registerationData);
        db.query('SELECT id FROM companies WHERE name = ?', [companyName], (err, results) => {
            if (err) {
                console.error('Error fetching company_id:', err);
                return res.status(500).send({ error: 'Failed to fetch company information.' });
            }

            if (results.length === 0) {
                return res.status(400).send({ error: `Company '${companyName}' not found.` });
            }

            const companyId = results[0].id;
            
            const { email, password, firstName, lastName } = registration.registerationData;

            // Insert interviewer into the database
            db.query(
                'INSERT INTO interviewers (email, password, first_name, last_name, company_id) VALUES (?, ?, ?, ?, ?)',
                [email, password, firstName, lastName, companyId],
                (err) => {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') {
                            return res.status(400).send({ error: 'This email is already registered as an interviewer.' });
                        }
                        console.error('Error registering interviewer:', err);
                        return res.status(500).send({ error: 'Failed to register interviewer.' });
                    }
       
                    // Remove pending registration
                    delete pendingRegistrations[email];
                    res.status(200).send({ message: 'Interviewer registered successfully.' });
                }
            );
        });
    } else {
        res.status(400).send({ error: 'Invalid registration type.' });
    }
});






app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

app.get('/verify-otp', (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).send('Email is required');
    }

    res.render('verify-otp', {
        email,
        errorMessage: null,  // No error by default
        successMessage: null // No success by default
    });
});


app.get('/login', (req, res) => {
    res.render('login');
});





app.get('/register', async (req, res) => {
    res.render('register'); 
});

function sendOtpEmail(otp, email, type, res, registerationData) {
    const otpHash = crypto.createHash('sha256').update(otp.toString()).digest('hex');
    pendingRegistrations[email] = {
        otpHash,
        createdAt: Date.now(),
        type,
        registerationData
    };
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Verification Code for Xynq is Here!',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
    <h1 style="color: #007bff; text-align: center; font-size: 24px;">Your Verification Code for Xynq</h1>
    <p style="margin: 0 0 16px; font-size: 16px;">
        Hello <strong>${registerationData.firstName}</strong>,
    </p>
    <p style="margin: 0 0 16px; font-size: 16px;">
        Welcome to <strong>Xynq</strong>! We're excited to have you on board. To get started, please use the OTP below to verify your email:
    </p>
    <div style="text-align: center; margin: 20px 0;">
        <h2 style="color: #007bff; font-size: 36px; margin: 0;">${otp}</h2>
    </div>
    <p style="margin: 0 0 16px; font-size: 16px;">
        This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.
    </p>
    <p style="margin: 0 0 16px; font-size: 16px;">Cheers,</p>
    <p style="margin: 0 0 16px; font-size: 16px;"><strong>The Xynq Team</strong></p>
</div>
        `,
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            if (error.responseCode === 550) {
                console.error('Invalid email address:', email);
                return res.status(400).send('Invalid email address. Please provide a valid one.');
            } else {
                console.error('Error sending OTP:', error);
                return res.status(500).send('Unexpected error occurred while sending OTP.');
            }
        }
        res.redirect(`/verify-otp?email=${email}`);
    });
}


app.post('/register/candidate', async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
        return res.status(400).send({ error: 'All required fields must be filled out.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send({ error: 'Invalid email format.' });
    }

    // Check if the email is already registered (not yet inserted into the DB)
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpHash = crypto.createHash('sha256').update(otp.toString()).digest('hex');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Send OTP to email
    sendOtpEmail(otp, email, 'candidate', res, { email, password : hashedPassword, firstName, lastName });
    // Send the OTP hash and the email to store for later verification
    // You can store this in a temporary session or a temporary table
    // We aren't inserting into the candidate table yet.
    // res.status(200).send({ message: 'OTP sent to your email for verification.' });
});





app.post('/register/interviewer', async (req, res) => {
    const { email, password, firstName, lastName, company } = req.body;

    if (!email || !password || !firstName || !lastName || !company) {
        return res.status(400).send({ error: 'All required fields must be filled out.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send({ error: 'Invalid email format.' });
    }

    // Check if the company exists in the database
    db.query('SELECT * FROM companies WHERE name = ?', [company], async (err, results) => {
        if (err) return res.status(500).send({ error: 'Error checking company existence.' });

        if (results.length === 0) {
            return res.status(400).send({ error: 'Company does not exist. Please select a valid company.' });
        }

        // Generate OTP and send to email
        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpHash = crypto.createHash('sha256').update(otp.toString()).digest('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        // Send OTP to interviewer's email
        sendOtpEmail(otp, email, 'interviewer', res, { email, password: hashedPassword, firstName, lastName,company });
    });
});

app.get('/companies', (req, res) => {
    // Fetch all companies from the database sorted alphabetically
    db.query('SELECT name FROM companies ORDER BY name ASC', (err, results) => {
        if (err) {
            return res.status(500).send({ error: 'Failed to fetch companies.' });
        }
        res.status(200).send({ companies: results });
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

// app.post('/login', async (req, res) => {
//     const { username, password } = req.body;

//     if (username && password) {
//         db.query('SELECT * FROM users WHERE username = ?', [username], async (error, results) => {
//             if (error) {
//                 res.send('Database query error');
//             } else {
//                 const user = results[0];
//                 if (user && await bcrypt.compare(password, user.password)) {
//                     req.session.loggedin = true;
//                     req.session.username = username;
//                     res.redirect('/');
//                 } else {
//                     res.send('Incorrect Username and Password!');
//                 }
//             }
//         });
//     }
// });



app.post('/login', async (req, res) => {
    const { email, password, type } = req.body;

    if (!email || !password || !type) {
        return res.status(400).send({ error: 'Email, password, and user type are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send({ error: 'Invalid email format.' });
    }

    let tableName;
    if (type === 'candidate') {
        tableName = 'candidates';
    } else if (type === 'interviewer') {
        tableName = 'interviewers';
    } else {
        return res.status(400).send({ error: 'Invalid user type. Must be "candidate" or "interviewer".' });
    }

    // Query the appropriate table
    db.query(`SELECT * FROM ${tableName} WHERE email = ?`, [email], async (err, results) => {
        if (err) {
            console.error('Error fetching user data:', err);
            return res.status(500).send({ error: 'Error fetching user data.' });
        }

        if (results.length === 0) {
            return res.status(401).send({ error: 'Invalid email or password.' });
        }

        const user = results[0];

        // Compare the provided password with the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send({ error: 'Invalid email or password.' });
        }


        const tokenPayload = {
            id : user.id, 
            email : user.email, 
            userType : type 
        }; 

        const accessToken = jwt.sign (
            tokenPayload, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRATION }
            
        ); 
        res.cookie('jwtToken', accessToken, {
            httpOnly: true, // Cannot be accessed via JavaScript
            secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
            sameSite: 'Strict', // Prevent CSRF attacks
            expires: new Date(Date.now() + 3600000), // Set expiration time (e.g., 1 hour)
        });
        if (type === 'candidate') {
            return res.redirect('/candidate-dashboard');
        } else {
            return res.redirect('/interviewerDashboard');
        } 
    });
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


