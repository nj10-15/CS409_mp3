const express = require('express');
const {
  listTasks,
  createTask,
  getTask,
  replaceTask,
  deleteTask
} = require('../controllers/taskController');

const router = express.Router();

router.route('/').get(listTasks).post(createTask);
router.route('/:id').get(getTask).put(replaceTask).delete(deleteTask);

module.exports = router;
