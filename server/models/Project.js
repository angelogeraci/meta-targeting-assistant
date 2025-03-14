const mongoose = require('mongoose');

// Schéma pour les résultats de recherche
const ResultSchema = new mongoose.Schema({
  criteria: {
    type: Object,
    required: true
  },
  results: {
    type: Array,
    default: []
  },
  metrics: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schéma pour les projets
const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Pending'],
    default: 'In Progress'
  },
  targetAudience: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  categories: {
    type: [String],
    default: []
  },
  results: {
    type: Array,
    default: []
  },
  budget: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware pour mettre à jour la date de modification
ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', ProjectSchema); 