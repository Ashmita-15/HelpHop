import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) throw new Error('MONGO_URI is not set. Copy server/.env.example to server/.env');

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`✅ MongoDB connected: ${mongoose.connection.name}`);
  return mongoose.connection;
}
