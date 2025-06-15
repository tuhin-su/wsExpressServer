const express = require('express');
const router = express.Router();
const { getUser } = require('../controllers/userController');

router.get('/:id', async (req, res) => {
  const data = await getUser(req.params.id);
  res.json(data);
});

module.exports = router;
