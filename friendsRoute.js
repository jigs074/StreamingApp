const express = require('express'); 
const router = express.Router();
const db = require('./db'); 

// GET route to render send friend request page
router.get('/send-friend-request', (req, res) => {
    if (!req.session.username) {
        return res.status(401).send('You need to be logged in to send the friend requests');
    }
    res.render('send-friend-request');
});

router.get('/accept-friend-request', (req, res) => {
    if (!req.session.username) {
        return res.status(401).send('You need to be logged in to send the friend requests');
    }
    res.render('accept-friend-request');
});
// POST route to send a friend request
// Send Friend Request Route
router.post('/sendFriendRequest', (req, res) => {
    const { friendUsername } = req.body;
    const requesterUsername = req.session.username; // Retrieve username from session

    if (!requesterUsername) {
        return res.status(401).json({ error: 'Unauthorized: Please log in.' });
    }

    // Step 1: Find the requester ID by username
    db.query('SELECT id FROM users WHERE username = ?', [requesterUsername], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const requesterId = results[0].id;

        // Step 2: Find the friend ID by username
        db.query('SELECT id FROM users WHERE username = ?', [friendUsername], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            const friendId = results[0].id;

            // Step 3: Insert the friend request into friend_requests table
            db.query(
                'INSERT INTO friend_requests (requester_id, receiver_id, status) VALUES (?, ?, ?)',
                [requesterId, friendId, 'pending'],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error sending friend request' });
                    }
                    res.json({ message: 'Friend request sent successfully!' });
                }
            );
        });
    });
});

// POST route to accept a friend request
// Accept Friend Request Route
router.post('/acceptFriendRequest', (req, res) => {
    const { requesterUsername } = req.body; // The username of the person whose friend request is being accepted
    const receiverUsername = req.session.username; // The username of the person accepting the request

    if (!receiverUsername) {
        return res.status(401).json({ error: 'Unauthorized: Please log in.' });
    }

    // Step 1: Find the receiver ID by username
    db.query('SELECT id FROM users WHERE username = ?', [receiverUsername], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const receiverId = results[0].id;

        // Step 2: Find the requester ID by username
        db.query('SELECT id FROM users WHERE username = ?', [requesterUsername], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            const requesterId = results[0].id;

            // Step 3: Update the friend request status to "accepted"
            db.query(
                'UPDATE friend_requests SET status = ? WHERE requester_id = ? AND receiver_id = ?',
                ['accepted', requesterId, receiverId],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error accepting friend request' });
                    }

                    // Step 4: Optionally, you can insert a record in a friends table (if needed)
                    db.query(
                        'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)',
                        [receiverId, requesterId],
                        (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Error adding friend' });
                            }
                            res.json({ message: 'Friend request accepted successfully!' });
                        }
                    );
                }
            );
        });
    });
});

// POST route to reject a friend request
router.post('/reject-friend-request', (req, res) => {
    const { userId } = req.body; // The sender's user ID
    const friendId = req.session.userId; // The logged-in user's ID

    // Delete the pending friend request
    db.query(
        `DELETE FROM friend_requests WHERE user_id = ? AND friend_id = ? AND status = 'pending'`,
        [userId, friendId],
        (err, result) => {
            if (err) return res.status(500).send('Error rejecting friend request');
            if (result.affectedRows === 0) return res.status(400).send('No pending friend request found');
            res.send('Friend request rejected');
        }
    );
});

// GET route to fetch a user's accepted friends
router.get('/friends/:userId', (req, res) => {
    const userId = req.params.userId;

    db.query(
        `SELECT users.id, users.username, friend_requests.status FROM friend_requests 
         JOIN users ON friend_requests.friend_id = users.id 
         WHERE friend_requests.user_id = ? AND friend_requests.status = 'accepted'`, 
        [userId], 
        (err, results) => {
            if (err) return res.status(500).send('Error fetching friends');
            res.json(results);
        }
    );
});

// GET route to fetch pending friend requests for the logged-in user
router.get('/pending-requests', (req, res) => {
    const friendId = req.session.userId; // The logged-in user's ID

    // Fetch pending friend requests
    db.query(
        `SELECT u.username FROM friend_requests fr 
         JOIN users u ON fr.user_id = u.id 
         WHERE fr.friend_id = ? AND fr.status = 'pending'`,
        [friendId], 
        (err, results) => {
            if (err) return res.status(500).send('Error fetching pending requests');
            res.json(results);
        }
    );
});

module.exports = router;
