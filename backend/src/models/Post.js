import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'gobierno', 'empresas', 'educacion', 'salud', 'justicia'],
    default: 'general'
  },
  link: {
    type: String,
    trim: true
  },
  votes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderatedBy: {
    type: String,
    default: ''
  },
  moderationDate: {
    type: Date
  },
  moderationNotes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

export default mongoose.model('Post', postSchema);