const express = require('express');
const router = express.Router();

const certificatesRouter = require('./certificates');

router.use(certificatesRouter);

module.exports = router;
