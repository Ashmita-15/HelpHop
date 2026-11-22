
import mongoose from 'mongoose';

let connectionPromise = null;

export async function connectDB(uri) {
  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Allow reconnection if the previous connection was lost.
  if (mongoose.connection.readyState === 0) {
    connectionPromise = null;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      bufferCommands: true
    })
      .then(() => {
        console.log(
          `MongoDB connected: ${mongoose.connection.name}`
        );
        return mongoose.connection;
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}
