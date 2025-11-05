import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'User name is required'] },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    pendingTasks: { type: [String], default: [] },
    dateCreated: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export default mongoose.model('User', UserSchema);
