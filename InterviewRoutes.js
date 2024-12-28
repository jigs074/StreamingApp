const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();
const db = require("./db"); // Assuming you have a db module for MySQL queries

require('dotenv').config({ path: './EmailCreds.env' });
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Request Interview Endpoint
// Route to request an interview
router.post('/request-interview', (req, res) => {
    const { interviewerEmail, candidateEmail, position } = req.body;

    // Step 1: Get the interviewer by email
    db.query('SELECT id, tag FROM users WHERE email = ?', [interviewerEmail], (err, interviewerResult) => {
        if (err) return res.status(500).json({ error: err.message });

        const interviewer = interviewerResult[0];
        if (!interviewer || interviewer.tag !== 'interviewer') {
            return res.status(400).json({ error: 'The email provided does not belong to a valid interviewer.' });
        }

        // Step 2: Get the candidate by email
        db.query('SELECT id, tag, email FROM users WHERE email = ?', [candidateEmail], (err, candidateResult) => {
            if (err) return res.status(500).json({ error: err.message });

            const candidate = candidateResult[0];
            if (!candidate || candidate.tag !== 'candidate') {
                return res.status(400).json({ error: 'The email provided does not belong to a valid candidate.' });
            }
            // Step 3: Insert interview request into the interviews table
            const interviewData = {
                interviewer_id: interviewer.id,
                candidate_id: candidate.id,
                role: position,  // Set the position as the role value
                status: 'pending',
            };

            db.query('INSERT INTO interviews SET ?', interviewData, (err, result) => {
                if (err) return res.status(500).json({ error: err.message });

                // Step 4: Send email to the candidate
                const mailOptions = {
                    from: 'process.env.EMAIL_USER',
                    to: candidate.email,
                    subject: 'Interview Request',
                    text: `You have received an interview request for the position of ${position}. Please check your dashboard to accept or reject the interview.`
                };

                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) return res.status(500).json({ error: err.message });
                    return res.status(200).json({ message: 'Interview request sent and email notification sent.' });
                });
            });
        });
    });
});


module.exports = router;
