import 'dotenv/config';
import { connectToDatabase } from '../database/mongoose';

(async () => {
  try {
    await connectToDatabase();
    console.log('✅ Database connection test successful');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection test failed');
    console.error(error);
    process.exit(1);
  }
})();
