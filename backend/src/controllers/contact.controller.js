const { sendDemoRequestEmail } = require('../services/email.service');

const submitDemoRequest = async (req, res) => {
  try {
    const { name, schoolName, email, phone } = req.body;

    await sendDemoRequestEmail({
      name,
      schoolName,
      email,
      phone,
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Demo request email error:', error);
    res.status(500).json({ ok: false, message: 'Failed to send demo request' });
  }
};

module.exports = {
  submitDemoRequest,
};
