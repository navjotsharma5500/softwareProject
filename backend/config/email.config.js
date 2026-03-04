/**
 * @module config/email
 * @description Nodemailer Gmail SMTP transporter used by {@link module:utils/email}
 * to send claim-status and report-submission notification emails.
 *
 * Required environment variables:
 *  - `GMAIL_USER` – the sending Gmail address
 *  - `GMAIL_PASS` – a Gmail App Password (not the account password)
 */
import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

/**
 * Pre-configured Nodemailer transport that authenticates via Gmail SMTP.
 * Import this singleton wherever emails need to be sent.
 *
 * @type {import('nodemailer').Transporter}
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS, // App password or Gmail password
  },
});

export default transporter;
