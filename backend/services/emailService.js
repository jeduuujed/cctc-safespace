const nodemailer = require('nodemailer');

// Uses Gmail by default; configure via environment variables.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // e.g. school@gmail.com
    pass: process.env.EMAIL_PASS // Gmail app password
  }
});

exports.sendNewReportNotification = async (summary) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_TO) {
    console.warn('Email env vars not set; skipping email notification.');
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO, // e.g. guidance@school.edu
    subject: 'New Bullying Report Submitted',
    text:
      'A new bullying incident report has been submitted.\n\n' +
      'Summary:\n' +
      summary
  });
};

exports.sendLoginCode = async (email, code) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Gmail email credentials are not configured');
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your CCTC SafeSpace authentication code',
    text: `Your CCTC SafeSpace authentication code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`
  });
};

