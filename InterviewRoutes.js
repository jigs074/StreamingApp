const express = require('express');
const router = express.Router();
const db = require('./db');
const nodemailer = require("nodemailer");
require('dotenv').config({ path: './EmailCreds.env' });

router.post("/request-interview", async (req, res) => {
    const { candidate_id, interviewer_id, role, scheduled_time } = req.body;
  
    // Validate inputs
    if (!candidate_id || !interviewer_id || !role || !scheduled_time) {
      return res.status(400).json({
        error: "All fields are required (candidate_id, interviewer_id, role, scheduled_time).",
      });
    }
  
    try {
      // Fetch candidate details (tag must be 'candidate')
      const candidateQuery = await db.query(
        "SELECT id, email, username FROM users WHERE id = ? AND tag = 'candidate'",
        [candidate_id]
      );
      const candidate = candidateQuery && candidateQuery[0] ? candidateQuery[0] : null;
  
    //   if (!candidate) {
    //     return res
    //       .status(400)
    //       .json({ error: `Invalid candidate ID or the user is not tagged as 'candidate'.` });
    //   }
  
      // Fetch interviewer details (tag must be 'interviewer')
      const interviewerQuery = await db.query(
        "SELECT id, email, username FROM users WHERE id = ? AND tag = 'interviewer'",
        [interviewer_id]
      );
      const interviewer = interviewerQuery && interviewerQuery[0] ? interviewerQuery[0] : null;
  
    //   if (!interviewer) {
    //     return res
    //       .status(400)
    //       .json({ error: `Invalid interviewer ID or the user is not tagged as 'interviewer'.` });
    //   }
  
      // Insert the interview request with status 'pending'
      await db.query(
        "INSERT INTO interviews (candidate_id, interviewer_id, role, date, status) VALUES (?, ?, ?, ?, 'pending')",
        [candidate.id, interviewer.id, role, scheduled_time]
      );
  
      // Prepare and send email to the candidate
      const emailSubject = `Interview Request from ${interviewer.username}`;
      const emailText = `
        Hi ${candidate.username},
  
        You have received an interview request from ${interviewer.username} for the role of ${role}. The interview is scheduled for:
        Date & Time: ${scheduled_time}
  
        Please click the link below to accept or decline the interview:
        http://localhost:3000/accept-interview/${candidate.id}/${interviewer.id}
      `;
  
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: candidate.email,
        subject: emailSubject,
        text: emailText,
      });
  
      // Respond with success message
      res.status(200).json({ message: "Interview request sent successfully!" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  });
  

module.exports = router;
