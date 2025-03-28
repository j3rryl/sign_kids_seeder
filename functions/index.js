/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable object-curly-spacing */
/* eslint-disable indent */

const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
require("dotenv").config();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

// Load email credentials from Firebase Config
const user = process.env.USER_EMAIL;
const pass = process.env.USER_PASS;

// Gmail SMTP Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass },
});

exports.sendEmail = functions.https.onCall(async ({ data }) => {
  const { email, subject, message } = data;

  if (!email || !subject || !message) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing parameters" + data
    );
  }

  const mailOptions = {
    from: user,
    to: email,
    subject: subject,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Email sent!" };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.toString());
  }
});
