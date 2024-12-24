import nodemailer from "nodemailer"


const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAILID,
    pass: process.env.EMAILPASSWORD,
  },
});

// const TEXT = `Here is your OTP: ${otp}
// To authenticate, please use the following code.
// This OTP is valid for 2 Minutes. Do not share your credentials or OTP with anyone on call, email or SMS.
// Remember, we're always an email or call away when you need help. Till next time, ciao!
// Regards,
// Team SpareCare`
// const mailOptions = {
//     from: process.env.EMAILID,
//     to: email,
//     subject: 'Password Reset OTP',
//     text: `Here is your OTP: ${otp}
// To authenticate, please use the following code.
// This OTP is valid for 2 Minutes. Do not share your credentials or OTP with anyone on call, email or SMS.
// Remember, we're always an email or call away when you need help. Till next time, ciao!
// Regards,
// Team SpareCare`,
//   };

export {transporter}