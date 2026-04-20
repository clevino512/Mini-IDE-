import mongoose, { Schema, Document, Types } from 'mongoose'
import { Language } from '../types'

export interface IExecutionLog extends Document {
  file_id: Types.ObjectId | null
  language: Language
  output: string
  error: string
  executed_at: Date
  duration_ms: number
}

const ExecutionLogSchema = new Schema<IExecutionLog>(
  {
    file_id: {
      type: Schema.Types.ObjectId,
      ref: 'RecentFile',
      default: null,
    },
    language: {
      type: String,
      enum: ['py', 'c', 'js'],
      required: true,
    },
    output: {
      type: String,
      default: '',
    },
    error: {
      type: String,
      default: '',
    },
    executed_at: {
      type: Date,
      default: Date.now,
    },
    duration_ms: {
      type: Number,
      required: true,
    },
  },
  { timestamps: false }
)

export const ExecutionLogModel =
  mongoose.models.ExecutionLog || mongoose.model<IExecutionLog>('ExecutionLog', ExecutionLogSchema)
