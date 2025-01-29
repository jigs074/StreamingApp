
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

router.get('/interviewerDashboard', authenticateToken,(req, res) => {
    const token = req.cookies.jwtToken;  // Retrieve the token from the cookies

    if (!token) {
        return res.redirect('/login');  // Redirect to login if no token exists
    }

    res.render('interviewerDashboard', { jwtToken: token });  // Pass the token to the EJS template
});

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
                let timeSlotList = timeSlots.map(slot => `<li>${new Date(slot).toLocaleString()}</li>`).join('');
                const emailContent = `
                    <h1>Interview Request for ${position}</h1>
                    <p>Dear Candidate,</p>
                    <p>We are excited to inform you that we would like to schedule an interview for the position of <strong>${position}</strong>. Below are the available time slots:</p>
                    <ul>
                        ${timeSlotList}
                    </ul>
                    <p>Please select one of the above time slots by replying to this email or following the instructions on your dashboard.</p>
                    <p>If you are not yet registered, please complete your registration by clicking <a href="https://yourdomain.com/register">here</a>.</p>
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


module.exports = router;        

        