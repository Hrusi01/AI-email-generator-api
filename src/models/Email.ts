import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEmail {
  threadId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string; // The prompt instruction or the generated email
  subject?: string; // For the assistant's response
  createdAt: Date;
}

export interface IEmailDocument extends IEmail, Document {}

const EmailSchema = new Schema<IEmailDocument>(
  {
    threadId: { type: Schema.Types.ObjectId, ref: 'EmailThread', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    subject: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Email: Model<IEmailDocument> =
  mongoose.models.Email || mongoose.model<IEmailDocument>('Email', EmailSchema);
