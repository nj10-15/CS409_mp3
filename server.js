import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import connectDB from './src/db.js';

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    const server = createServer(app);
    server.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
})();
