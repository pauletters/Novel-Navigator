import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const db = async (): Promise<typeof mongoose.connection> => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/googlebooks');
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn.connection;
    } catch (error) {
      console.error('Database connection error:', error);
      process.exit(1);
    }
  };
  
  export default db;

