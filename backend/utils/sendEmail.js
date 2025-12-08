import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text, html = null) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"MoodMeet" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: text,
    });

    console.log("Email sent to:", to);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
