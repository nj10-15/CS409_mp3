import { Router } from 'express';
import {
  listTasks,
  createTask,
  getTask,
  replaceTask,
  deleteTask
} from '../controllers/taskController.js';

const router = Router();

router.route('/')
  .get(listTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(replaceTask)
  .delete(deleteTask);

export default router;
