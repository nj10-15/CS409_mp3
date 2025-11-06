const Task = require('../models/task');
const User = require('../models/user');
const asyncHandler = require('../middleware/asyncHandler');
const { buildQuery, applySelectToIdQuery } = require('../utils/query');

//helpers to normalize form-urlencoded inputs
function normalizeBool(value, defaultVal = false) {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null) return defaultVal;
  const s = String(value).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return defaultVal;
}

// Accepts numbers, numeric strings, scientific notation, seconds or ms
function normalizeDeadline(value) {
  if (value instanceof Date) return value;
  let n = Number(value);
  if (!Number.isNaN(n)) {
    if (n < 1e11) n = n * 1000;
    return new Date(n);
  }
  const f = parseFloat(value);
  if (!Number.isNaN(f)) {
    const ms = f < 1e11 ? f * 1000 : f;
    return new Date(ms);
  }
  const d = new Date(value);
  return d;
}

async function removeFromUserPending(task) {
  if (task.assignedUser) {
    await User.updateOne(
      { _id: task.assignedUser },
      { $pull: { pendingTasks: String(task._id) } }
    );
  }
}

async function syncTaskUserLinks(task) {
  if (task.assignedUser) {
    if (task.completed) {
      await User.updateOne(
        { _id: task.assignedUser },
        { $pull: { pendingTasks: String(task._id) } }
      );
    } else {
      await User.updateOne(
        { _id: task.assignedUser },
        { $addToSet: { pendingTasks: String(task._id) } }
      );
    }
  }
}

//controllers
const listTasks = asyncHandler(async (req, res) => {
  const { q, count } = buildQuery(Task, req, { defaultLimit: 100 });
  if (count) {
    const n = await Task.countDocuments(q.getQuery());
    return res.status(200).json({ message: 'OK', data: { count: n } });
  }
  const docs = await q.exec();
  res.status(200).json({ message: 'OK', data: docs });
});

const createTask = asyncHandler(async (req, res) => {
  let {
    name,
    description = '',
    deadline,
    completed = false,
    assignedUser = '',
    assignedUserName = 'unassigned'
  } = req.body || {};

  if (!name || deadline === undefined) {
    return res
      .status(400)
      .json({ message: 'Task name and deadline are required.', data: null });
  }

  const deadlineDate = normalizeDeadline(deadline);
  const completedBool = normalizeBool(completed, false);
  if (isNaN(deadlineDate.getTime())) {
    return res.status(400).json({ message: 'Invalid deadline.', data: null });
  }

  let realAssignedName = assignedUserName;
  if (assignedUser) {
    const u = await User.findById(assignedUser);
    if (!u) {
      return res
        .status(400)
        .json({ message: 'Assigned user does not exist.', data: null });
    }
    realAssignedName = u.name;
  }

  const task = await Task.create({
    name,
    description,
    deadline: deadlineDate,
    completed: completedBool,
    assignedUser: assignedUser || '',
    assignedUserName: assignedUser ? realAssignedName : 'unassigned'
  });

  await syncTaskUserLinks(task);
  res.status(201).json({ message: 'Created', data: task });
});

const getTask = asyncHandler(async (req, res) => {
  const q = Task.findById(req.params.id);
  const doc = await applySelectToIdQuery(q, req).exec();
  if (!doc) return res.status(404).json({ message: 'Task not found', data: null });
  res.status(200).json({ message: 'OK', data: doc });
});

const replaceTask = asyncHandler(async (req, res) => {
  const id = req.params.id;
  let {
    name,
    description = '',
    deadline,
    completed = false,
    assignedUser = '',
    assignedUserName = 'unassigned'
  } = req.body || {};

  if (!name || deadline === undefined) {
    return res
      .status(400)
      .json({ message: 'Task name and deadline are required.', data: null });
  }

  const existing = await Task.findById(id);
  if (!existing) return res.status(404).json({ message: 'Task not found', data: null });

  if (String(existing.assignedUser) && String(existing.assignedUser) !== String(assignedUser)) {
    await removeFromUserPending(existing);
  }

  const deadlineDate = normalizeDeadline(deadline);
  const completedBool = normalizeBool(completed, false);
  if (isNaN(deadlineDate.getTime())) {
    return res.status(400).json({ message: 'Invalid deadline.', data: null });
  }

  let realAssignedName = 'unassigned';
  if (assignedUser) {
    const u = await User.findById(assignedUser);
    if (!u) {
      return res
        .status(400)
        .json({ message: 'Assigned user does not exist.', data: null });
    }
    realAssignedName = u.name;
  }

  existing.name = name;
  existing.description = description;
  existing.deadline = deadlineDate;
  existing.completed = completedBool;
  existing.assignedUser = assignedUser || '';
  existing.assignedUserName = assignedUser ? realAssignedName : 'unassigned';

  await existing.save();
  await syncTaskUserLinks(existing);

  res.status(200).json({ message: 'OK', data: existing });
});

const deleteTask = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: 'Task not found', data: null });

  await removeFromUserPending(task);
  await task.deleteOne();

  res.status(200).json({ message: 'Deleted', data: null });
});

module.exports = { listTasks, createTask, getTask, replaceTask, deleteTask };
