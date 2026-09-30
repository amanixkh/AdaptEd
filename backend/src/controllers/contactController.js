// nodemailer is optional until email is configured (npm install nodemailer)
let nodemailer = null;
try { nodemailer = require("nodemailer"); } catch { nodemailer = null; }
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = ["general", "support", "school", "feedback"];

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

const sendContactMessage = async (req, res) => {
  try {
    const { name, email, topic, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        message: "Name, email and message are required",
      });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (name.trim().length === 0 || name.length > 100) {
      return res.status(400).json({
        message: "Name must be between 1 and 100 characters",
      });
    }
    if (message.trim().length < 10 || message.length > 4000) {
      return res.status(400).json({
        message: "Message must be between 10 and 4000 characters",
      });
    }
    const normalizedTopic = TOPICS.includes(topic) ? topic : "general";

    if (!nodemailer || !process.env.SMTP_HOST || !process.env.CONTACT_TO_EMAIL) {
      // SMTP not configured yet — don't fail the request, just log it
      // so the frontend team can keep testing while backend sets up email.
      console.warn("Contact message received (SMTP not configured):", {
        name,
        email: normalizedEmail,
        topic: normalizedTopic,
        message,
      });
      return res.status(200).json({ success: true, delivered: false });
    }

    await getTransporter().sendMail({
      from: process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER,
      to: process.env.CONTACT_TO_EMAIL,
      replyTo: normalizedEmail,
      subject: `[AdaptEd contact] ${normalizedTopic} — ${name}`,
      text: `From: ${name} <${normalizedEmail}>\nTopic: ${normalizedTopic}\n\n${message}`,
    });

    res.status(200).json({ success: true, delivered: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { sendContactMessage };
