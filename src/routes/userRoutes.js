import { Router } from 'express';
import {
  listUsers,
  createUser,
  getUser,
  replaceUser,
  deleteUser
} from '../controllers/userController.js';

const router = Router();

router.route('/')
  .get(listUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(replaceUser)
  .delete(deleteUser);

export default router;
