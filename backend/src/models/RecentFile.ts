import mongoose, { Schema, Document } from 'mongoose'
import { Language } from '../types'

export interface IRecentFile extends Document {
  filename: string
  filepath: string
  language: Language
  content: string
  opened_at: Date
  created_at: Date
}

const RecentFileSchema = new Schema<IRecentFile>(
  {
    filename: {
      type: String,
      required: true,
    },
    filepath: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    language: {
      type: String,
      enum: ['py', 'c', 'js'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    opened_at: {
      type: Date,
      default: Date.now,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
)

export const RecentFileModel =
  mongoose.models.RecentFile || mongoose.model<IRecentFile>('RecentFile', RecentFileSchema)
