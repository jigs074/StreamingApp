
const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();
const db = require("./db"); // Assuming you have a db module for MySQL queries
const authenticateToken = require('./authenticateToken'); 

require("dotenv").config({ path: "./EmailCreds.env" });
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


router.get('/request-interview', authenticateToken, (req, res) => {
       
    const token = req.cookies.jwtToken;  // Retrieve the token from the cookies

    if (!token) {
        return res.redirect('/login');  // Redirect to login if no token exists
    }
   
    res.render('request-interview');

}); 




// router.get('/interviewerDashboard', authenticateToken,(req, res) => {
//     const token = req.cookies.jwtToken;  // Retrieve the token from the cookies

//     if (!token) {
//         return res.redirect('/login');  // Redirect to login if no token exists
//     }

//     res.render('interviewerDashboard', { jwtToken: token });  // Pass the token to the EJS template
// });

router.get('/interviewerDashboard', authenticateToken, (req, res) => {
    const token = req.cookies.jwtToken; // Retrieve the token from cookies

    if (!token) {
        return res.redirect('/login'); // Redirect to login if no token exists
    }

    const roomId = generateRoomId(); // Generate or fetch the room ID

    res.render('interviewerDashboard', { jwtToken: token, roomId }); // Pass roomId to EJS
});

// Function to generate a random room ID
function generateRoomId() {
    return Math.random().toString(36).substr(2, 9); // Example: 'abc123xyz'
}


// Request Interview Endpoint
router.post('/request-interview', authenticateToken, (req, res) => {
    const { interviewerEmail, candidateEmail, position, timeSlots } = req.body;

    // Validate timeSlots
    if (!timeSlots || timeSlots.length === 0) {
        return res.status(400).json({ error: 'Please provide 3-4 time slots for the interview.' });
    }

    if (interviewerEmail === candidateEmail) {
        return res.status(400).json({ error: "Cannot request an interview to the same email." });
    }

    // Step 1: Check if interviewer exists
    const interviewerQuery = 'SELECT id FROM interviewers WHERE email = ?';

    db.query(interviewerQuery, [interviewerEmail], (err, interviewerResult) => {
        if (err) return res.status(500).json({ error: err.message });

        const interviewer = interviewerResult[0];
        if (!interviewer) {
            return res.status(400).json({ error: 'Invalid interviewer email.' });
        }

        // Step 2: Check if candidate exists in candidates table
        const candidateQuery = 'SELECT id, email FROM candidates WHERE email = ?';

        db.query(candidateQuery, [candidateEmail], (err, candidateResult) => {
            if (err) return res.status(500).json({ error: err.message });

            const candidate = candidateResult[0];
            let candidate_id = null;
            let candidate_email = candidateEmail;  // Default to the provided email

            if (candidate) {
                candidate_id = candidate.id;  // If candidate is registered, get their ID
                candidate_email = candidate.email;  // Use the candidate's email if they are registered
            }

            // Step 3: Insert the interview request with 'pending' status
            const interviewData = {
                interviewer_id: interviewer.id,
                candidate_email: candidate_email,  // Store the candidate's email directly
                candidate_id: candidate_id,        // If registered, store candidate_id, else NULL
                role: position,
                status: 'pending',
            };

            db.query('INSERT INTO interviews SET ?', interviewData, (err, result) => {
                if (err) return res.status(500).json({ error: err.message });


                // Step 4: Generate email content with time slots
                const selectionLinks = timeSlots.map(slot => {
                    const encodedSlot = encodeURIComponent(slot); // Encode to pass in URL
                    return `<li><a href="http://127.0.0.1:5000/select-slot?email=${candidate_email}&time=${encodedSlot}">Choose ${new Date(slot).toLocaleString()}</a></li>`;
                }).join('');
                
                const emailContent = `
                    <h1>Interview Request for ${position}</h1>
                    <p>Dear Candidate,</p>
                    <p>We are excited to inform you that we would like to schedule an interview for the position of <strong>${position}</strong>. Below are the available time slots:</p>
                    <ul>
                        ${selectionLinks}
                    </ul>
                    <p>Please select one of the above time slots by replying to this email or following the instructions on your dashboard.</p>
                    <p>If you are not yet registered, please complete your registration by clicking <a href="http://127.0.0.1:5000/register">here</a>.</p>
                    <p>Looking forward to your response.</p>
                    <p>Best regards,</p>
                    <p>Xynq</p>
                `;

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: candidate_email,  // Use candidate_email instead of candidateEmail
                    subject: `Interview Request for ${position}`,
                    html: emailContent,  // Use HTML for better formatting
                };

                // Send the email
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) return res.status(500).json({ error: err.message });

                    return res.status(200).json({ message: 'Interview request sent and email notification sent.' });
                });
            });
        });
    });
});

router.get('/select-slot', (req, res) => {
    const { email, time } = req.query;

    if (!email || !time) {
        return res.status(400).json({ error: "Invalid request. Missing email or time slot." });
    }

    // Step 1: Find the pending interview
    const query = `SELECT id FROM interviews WHERE candidate_email = ? AND status = 'pending'`;

    db.query(query, [email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ error: "No pending interview found." });

        const interviewId = result[0].id;
        const meetingId = `meeting-${interviewId}-${Date.now()}`; // Unique meeting ID

        // Step 2: Update interview with selected time & meeting ID
        const updateQuery = `UPDATE interviews SET selected_time = ?, meeting_id = ?, status = 'scheduled' WHERE id = ?`;

        db.query(updateQuery, [time, meetingId, interviewId], (err, updateResult) => {
            if (err) return res.status(500).json({ error: err.message });

            // Step 3: Send Confirmation Email
            const inviteLink = `https://yourdomain.com/meet/${meetingId}`;
            const emailContent = `
                <h1>Interview Confirmed</h1>
                <p>Your interview for <strong>${new Date(time).toLocaleString()}</strong> has been confirmed.</p>
                <p>Join the meeting here: <a href="${inviteLink}">${inviteLink}</a></p>
                <p>Best regards,</p>
                <p>Xynq</p>
            `;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Your Interview is Confirmed",
                html: emailContent
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) return res.status(500).json({ error: err.message });

                return res.send(`
                    <h1>Interview Confirmed</h1>
                    <p>Your interview has been scheduled for <strong>${new Date(time).toLocaleString()}</strong>.</p>
                    <p><a href="${inviteLink}">Join the interview</a></p>
                `);
            });
        });
    });
});



module.exports = router;        

        