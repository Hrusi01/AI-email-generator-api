import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEmailThread {
  title: string; // Brief title usually derived from initial prompt
  recipientName?: string;
  tone: string;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmailThreadDocument extends IEmailThread, Document {}

const EmailThreadSchema = new Schema<IEmailThreadDocument>(
  {
    title: { type: String, required: true },
    recipientName: { type: String },
    tone: { type: String, default: 'professional' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

export const EmailThread: Model<IEmailThreadDocument> =
  mongoose.models.EmailThread || mongoose.model<IEmailThreadDocument>('EmailThread', EmailThreadSchema);
