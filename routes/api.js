const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({type: 'success', message: 'You accessed the protected api route'})
});

module.exports = router;