const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(email, otp) {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f9;
                margin: 0;
                padding: 0;
            }
            .email-container {
                max-width: 600px;
                margin: 30px auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background-color: #008FFF;
                color: #ffffff;
                padding: 20px;
                text-align: center;
                font-size: 24px;
            }
            .content {
                padding: 20px;
                text-align: center;
                line-height: 1.6;
            }
            .otp {
                font-size: 28px;
                color: #4CAF50;
                font-weight: bold;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                padding: 20px;
                background-color: #f4f4f9;
                color: #666666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                Nearby
            </div>
            <div class="content">
                <p>Your One-Time Password (OTP) for verification is:</p>
                <p class="otp">${otp}</p>
                <p>This OTP is valid for the next <strong>5 minutes</strong>. Please do not share this code with anyone.</p>
                <p>If you did not request this OTP, please contact our support team immediately.</p>
            </div>
           
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: '"Nearby" <your-email@gmail.com>',
    to: email,
    subject: "Your OTP for Verification",
    html: htmlTemplate,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

module.exports = { sendEmail };
