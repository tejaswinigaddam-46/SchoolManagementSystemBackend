const nodemailer = require('nodemailer');
const config = require('../config');

const htmlEscapeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);

const createTransporter = () => {
  if (!config.email.user || !config.email.password) {
    throw new Error('Email credentials are not configured');
  }

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
};

const sendDemoRequestEmail = async ({ name, schoolName, email, phone }) => {
  const transporter = createTransporter();
  const toAddress = 'tejaswinigaddam46@gmail.com';
  const fromAddress = config.email.from || config.email.user;

  const subject = `New demo request from ${name}`;
  const text = [
    'New demo request received:',
    '',
    `Name: ${name}`,
    `School Name: ${schoolName}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
  ].join('\n');

  const safeName = escapeHtml(name);
  const safeSchoolName = escapeHtml(schoolName);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);

  const html = `
    <p><strong>New demo request received:</strong></p>
    <ul>
      <li><strong>Name:</strong> ${safeName}</li>
      <li><strong>School Name:</strong> ${safeSchoolName}</li>
      <li><strong>Email:</strong> ${safeEmail}</li>
      <li><strong>Phone:</strong> ${safePhone}</li>
    </ul>
  `;

  await transporter.sendMail({
    from: fromAddress,
    to: toAddress,
    replyTo: email,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendDemoRequestEmail,
};
