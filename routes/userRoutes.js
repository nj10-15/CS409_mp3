const express = require('express');
const {
  listUsers,
  createUser,
  getUser,
  replaceUser,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

router.route('/').get(listUsers).post(createUser);
router.route('/:id').get(getUser).put(replaceUser).delete(deleteUser);

module.exports = router;
