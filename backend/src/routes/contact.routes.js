const express = require('express');
const validate = require('../middleware/validation');
const contactSchema = require('../schemas/contact.schema');
const { submitDemoRequest } = require('../controllers/contact.controller');

const router = express.Router();

router.post(
  '/demo',
  validate(contactSchema.submitDemoRequest),
  submitDemoRequest,
);

module.exports = router;
