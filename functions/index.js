const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

// Load email credentials from Firebase Config
const user = functions.config().email.user;
const pass = functions.config().email.pass;

// Gmail SMTP Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass },
});

// Cloud Function to Send Email
exports.sendEmail = functions.https.onCall((data, context) => {
  const mailOptions = {
    from: user,
    to: data.email,
    subject: data.subject,
    text: data.message,
  };

  return transporter
    .sendMail(mailOptions)
    .then(() => ({ success: true, message: "Email sent!" }))
    .catch((error) => ({ success: false, message: error.toString() }));
});
