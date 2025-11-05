const User = require('../models/user');
const Task = require('../models/task');
const asyncHandler = require('../middleware/asyncHandler');
const { buildQuery, applySelectToIdQuery } = require('../utils/query');

async function syncUserPendingTasks(userId, pendingIds, userName) {
  const currentAssigned = await Task.find({ assignedUser: userId });
  const pendingSet = new Set(pendingIds.map(String));

  const toUnassign = currentAssigned.filter((t) => !pendingSet.has(String(t._id)));
  if (toUnassign.length) {
    const ids = toUnassign.map((t) => t._id);
    await Task.updateMany(
      { _id: { $in: ids } },
      { $set: { assignedUser: '', assignedUserName: 'unassigned' } }
    );
  }

  if (pendingIds.length) {
    const tasks = await Task.find({ _id: { $in: pendingIds } });
    const completedOnes = tasks.filter((t) => t.completed).map((t) => t._id);
    if (completedOnes.length) {
      const err = new Error('pendingTasks cannot include completed tasks.');
      err.status = 400;
      throw err;
    }
    await Task.updateMany(
      { _id: { $in: pendingIds } },
      { $set: { assignedUser: userId, assignedUserName: userName } }
    );
  }
}

const listUsers = asyncHandler(async (req, res) => {
  const { q, count } = buildQuery(User, req);
  if (count) {
    const n = await User.countDocuments(q.getQuery());
    return res.status(200).json({ message: 'OK', data: { count: n } });
  }
  const docs = await q.exec();
  res.status(200).json({ message: 'OK', data: docs });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, pendingTasks = [] } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required.', data: null });
  }
  const user = await User.create({ name, email, pendingTasks });
  if (pendingTasks.length) await syncUserPendingTasks(String(user._id), pendingTasks, user.name);
  res.status(201).json({ message: 'Created', data: user });
});

const getUser = asyncHandler(async (req, res) => {
  const q = User.findById(req.params.id);
  const doc = await applySelectToIdQuery(q, req).exec();
  if (!doc) return res.status(404).json({ message: 'User not found', data: null });
  res.status(200).json({ message: 'OK', data: doc });
});

const replaceUser = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { name, email, pendingTasks = [] } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required.', data: null });
  }

  const exists = await User.findById(id);
  if (!exists) return res.status(404).json({ message: 'User not found', data: null });

  const dup = await User.findOne({ email, _id: { $ne: id } });
  if (dup) {
    return res.status(400).json({ message: 'A user with that email already exists.', data: null });
  }

  exists.name = name;
  exists.email = email;
  exists.pendingTasks = pendingTasks;
  await exists.save();

  await syncUserPendingTasks(id, pendingTasks, name);

  res.status(200).json({ message: 'OK', data: exists });
});

const deleteUser = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: 'User not found', data: null });

  await Task.updateMany(
    { assignedUser: id },
    { $set: { assignedUser: '', assignedUserName: 'unassigned' } }
  );

  await user.deleteOne();
  res.status(200).json({ message: 'Deleted', data: null });
});

module.exports = { listUsers, createUser, getUser, replaceUser, deleteUser };
