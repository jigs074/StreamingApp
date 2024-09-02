const express = require('express'); 
const router = express.Router();
const db  = require('./db'); 
const path = require('path'); 
const multer = require('multer');
const fs = require('fs');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Serve static files from the "uploads" directory
router.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route to display the profile info
router.get('/profile', (req, res) => {
    if (req.session.loggedin) {
        const username = req.session.username;
        db.query('SELECT username, email, profilePicture FROM users WHERE username = ?', [username], (error, results) => {
            if (error) {
                console.error('Database query error:', error);
                res.status(500).send('Error fetching profile information');
            } else {
                res.render('profile', { user: results[0] });
            }
        });
    } else {
        res.redirect('/login');
    }
}); 

router.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to log out.');
        }
        // Redirect to login page after logout
        res.redirect('/login');
    });
});

// Route to update the profile info
router.post('/profile', upload.single('profilePicture'), (req, res) => {
    if (req.session.loggedin) {
        const username = req.session.username;
        const { email, password } = req.body;  // Get email and password from the form

        // Determine if a new profile picture was uploaded
        const profilePicture = req.file ? req.file.filename : null;

        let query = 'UPDATE users SET email = ?';
        let queryParams = [email];

        if (profilePicture) {
            query += ', profilePicture = ?';
            queryParams.push(profilePicture);
        }

        if (password) {
            query += ', password = ?';
            queryParams.push(password);
        }

        query += ' WHERE username = ?';
        queryParams.push(username);

        db.query(query, queryParams, (error, results) => {
            if (error) {
                console.error('Database update error:', error);
                res.status(500).send('Error updating profile information');
            } else {
                res.send('Profile updated successfully');
            }
        });
    } else {
        res.redirect('/login');
    } 
});

module.exports = router;
