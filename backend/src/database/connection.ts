import mongoose from 'mongoose'

export async function connectDB(): Promise<void> {
  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    throw new Error("❌ MONGODB_URI manquant dans le fichier .env")
  }

  try {
    await mongoose.connect(MONGODB_URI)
    console.warn('✅ MongoDB connecté')
  } catch (err) {
    console.warn('⚠️ MongoDB indisponible, mode sans persistance')
    console.warn((err as Error).message)
  }
}

export function getMongoose(): typeof mongoose {
  return mongoose
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1
}