const express = require('express'); 
const router = express.Router();
const db  = require('./db'); 

// Route to display the profile Info 
router.get('/profile', (req, res) => {
if (req.session.loggedin){
    const username = req.session.username; 
    db.query('SELECT username, email, profilePicture FROM users WHERE username = ?', [username], (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            res.status(500).send('Error fetching profile information');
        } else {
            res.render('profile', { user: results[0] });
        }
    });
}
   else {
    res.redirect('/login'); 

   }
}); 

// Route to update the profile Info 

router.post('/profile', upload.single('profilePicture'), async (req, res)=> {

    if (req.session.loggedin) {
        const username = req.session.username;
        const { email, profilePicture } = req.body;  // Assuming profilePicture is updated via a file input

        db.query('UPDATE users SET email = ?, profilePicture = ? WHERE username = ?', [email, profilePicture, username], (error, results) => {
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