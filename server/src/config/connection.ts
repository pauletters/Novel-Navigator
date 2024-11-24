import mongoose from 'mongoose';
import 'dotenv/config';


const db = async (): Promise<typeof mongoose.connection> => {
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
      }
      
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn.connection;
    } catch (error) {
      console.error('Database connection error:', error);
      process.exit(1);
    }
  };
  
  export default db;

