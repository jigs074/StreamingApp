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

router.get('/pending-friend-request', (req, res) => {
    if (!req.session.username) {
        return res.status(401).send('You need to be logged in to send the friend requests');
    }
    res.render('pending-friend-request');
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
router.post('/acceptFriendRequest', (req, res) => {
    const { requesterUsername } = req.body; // The user who sent the friend request
    const receiverUsername = req.session.username; // The current user (who is accepting the request)


    if (!receiverUsername) {
        return res.status(401).json({ error: 'Unauthorized: Please log in.' });
    }

    // First, retrieve the user IDs for both requester and receiver
    const getUserIdsQuery = `
        SELECT 
            u1.id AS requester_id, 
            u2.id AS receiver_id
        FROM users u1
        JOIN users u2 ON u2.username = ?
        WHERE u1.username = ?;
    `;

    db.query(getUserIdsQuery, [receiverUsername, requesterUsername], (err, results) => {
        if (err) {
            console.error('Error retrieving user IDs:', err);
            return res.status(500).json({ error: 'Database error occurred' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Users not found' });
        }

        const { requester_id, receiver_id } = results[0];

        // Update the friend_requests table to 'accepted'
        const updateRequestStatusQuery = `
            UPDATE friend_requests
            SET status = 'accepted'
            WHERE requester_id = ? AND receiver_id = ?;
        `;

        db.query(updateRequestStatusQuery, [requester_id, receiver_id], (err) => {
            if (err) {
                console.error('Error updating friend request status:', err);
                return res.status(500).json({ error: 'Error accepting friend request' });
            }

            // Insert into the friends table to mark them as friends
            const insertFriendsQuery = `
                INSERT INTO friends (user_id, friend_id, created_at)
                VALUES (?, ?, NOW()), (?, ?, NOW());
            `;

            db.query(insertFriendsQuery, [requester_id, receiver_id, receiver_id, requester_id], (err) => {
                if (err) {
                    console.error('Error adding to friends table:', err);
                    return res.status(500).json({ error: 'Error adding friend' });
                }

                return res.status(200).json({ message: 'Friend request accepted successfully' });
            });
        });
    });
});



// POST route to reject a friend request
router.post('/rejectFriendRequest', (req, res) => {
    const { requestId } = req.body;
    const userId = req.session.userId;

    const sqlUpdate = `
        UPDATE friend_requests 
        SET status = 'rejected' 
        WHERE id = ? AND receiver_id = ?;
    `;

    db.query(sqlUpdate, [requestId, userId], (err, result) => {
        if (err) {
            console.error('Error rejecting friend request:', err);
            return res.status(500).send('Error rejecting friend request');
        }
        res.send('Friend request rejected!');
    });
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
// Fetch pending friend requests for the logged-in user
router.get('/pendingFriendRequests', (req, res) => {
    const userId = req.session.userId;  // Assuming you're storing the user's id in session
    const sql = `
        SELECT fr.id, u.username AS requester_username
        FROM friend_requests fr
        JOIN users u ON fr.requester_id = u.id
        WHERE fr.receiver_id = ? AND fr.status = 'pending'
    `;
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching friend requests:', err);
            return res.status(500).send('Error fetching friend requests');
        }
        res.json(results);
    });
});


module.exports = router;
