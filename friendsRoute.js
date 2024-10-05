const express = require('express'); 
const router = express.Router();
const db  = require('./db'); 
const path = require('path'); 
const multer = require('multer');
const fs = require('fs');



router.get('/send-friend-request', (req, res)=> {

    if (!req.session.username){
        return res.status(401).send('You need to be logged in to send the freind requests'); 
    }

    res.render('send-friend-request'); 

})
// Send a friend request 

// Route to send a friend request from User A to User B
// Route to send a friend request from User A to User B (using username)
router.post('/send-friend-request', (req, res) => {
    const { friendUsername } = req.body;  // The username of User B
    const userUsername = req.session.username;  // User A's username

    // Retrieve User B's ID based on username
    db.query(`SELECT id FROM users WHERE username = ?`, [friendUsername], (err, results) => {
        if (err) return res.status(500).send('Error retrieving user ID');
        if (results.length === 0) return res.status(404).send('User not found');

        const friendId = results[0].id;  // User B's ID

        // Check if the users are already friends or if a pending request exists
        db.query(`
            SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `, [req.session.userId, friendId, friendId, req.session.userId], (err, results) => {
            if (err) return res.status(500).send('Error sending friend request');
            if (results.length > 0) return res.status(400).send('Friend request already exists or users are already friends');

            // Insert the friend request with 'pending' status
            db.query(`
                INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'pending')
            `, [req.session.userId, friendId], (err) => {
                if (err) return res.status(500).send('Error sending friend request');
                res.send('Friend request sent successfully');
            });
        });
    });
});


  
  // Accept a freind request
  
  

router.post('/accept-friend-request', (req, res) => {
    const { userUsername } = req.body;  // User A's username
    const friendId = req.session.userId;  // User B's ID

    // Retrieve User A's ID based on username
    db.query(`SELECT id FROM users WHERE username = ?`, [userUsername], (err, results) => {
        if (err) return res.status(500).send('Error retrieving user ID');
        if (results.length === 0) return res.status(404).send('User not found');

        const userId = results[0].id;  // User A's ID

        // Update the friend request status to 'accepted'
        db.query(`
            UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ? AND status = 'pending'
        `, [userId, friendId], (err, result) => {
            if (err) return res.status(500).send('Error accepting friend request');
            if (result.affectedRows === 0) return res.status(400).send('No pending friend request found');
            res.send('Friend request accepted');
        });
    });
});

 // Reject the friend request
router.post('/reject-friend-request', (req, res) => {
    const { userId } = req.body;  // User A's ID (the one who sent the request)
    const friendId = req.session.userId;  // User B's ID (from session)

    // Delete the pending friend request
    db.query(`
        DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'
    `, [userId, friendId], (err, result) => {
        if (err) return res.status(500).send('Error rejecting friend request');
        if (result.affectedRows === 0) return res.status(400).send('No pending friend request found');
        res.send('Friend request rejected');
    });
});

  
  router.get('/friends/:userId', (req, res) => {
      const userId = req.params.userId;
  
      db.query('SELECT users.id, users.username, friends.status FROM friends JOIN users ON (friends.friend_id = users.id) WHERE friends.user_id = ? AND friends.status = "accepted"', [userId], (err, results) => {
          if (err) {
              return res.status(500).send('Error fetching friends');
          }
          res.json(results);
      });
  });
  
 // Fetch pending friend requests for the logged-in user (User B)

router.get('/pending-requests', (req, res) => {
    const friendId = req.session.userId;  // User B's ID

    // Fetch pending friend requests where User B is the recipient
    db.query(`
        SELECT u.username FROM friends f
        JOIN users u ON f.user_id = u.id
        WHERE f.friend_id = ? AND f.status = 'pending'
    `, [friendId], (err, results) => {
        if (err) return res.status(500).send('Error fetching pending requests');
        res.json(results);  // Send the pending requests
    });
});


module.exports = router; 
  