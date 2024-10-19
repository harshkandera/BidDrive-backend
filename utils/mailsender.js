const nodemailer = require("nodemailer");
require("dotenv").config();
const mailsender = async (email, title, body) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 587,
      secure: false,
      secureConnection: false,
      tls: {
        ciphers: "SSLv3",
      },
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      connectionTimeout: 10000,
      tls: {
        rejectUnauthorized: false,
      },
      logger: true, // Enable logger to debug issues
      debug: true, // Show detailed error messages
    });

    let info = await transporter.sendMail({
      from: '"Bid-Drive Support" <support@bid-drive.com>',
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });

    console.log(info);

    return info;
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = mailsender;
