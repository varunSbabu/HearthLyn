const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: [true, 'Provider ID is required']
  },
  serviceCategory: {
    type: String,
    required: [true, 'Service category is required'],
    enum: ['baby-care', 'tuition', 'tailoring', 'home-food', 'cleaning', 'cooking', 'elderly-care', 'pet-care']
  },
  serviceTitle: {
    type: String,
    required: [true, 'Service title is required']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Scheduled date must be in the future'
    }
  },
  scheduledTime: {
    start: {
      type: String,
      required: [true, 'Start time is required']
    },
    end: {
      type: String,
      required: [true, 'End time is required']
    }
  },
  duration: {
    value: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months'],
      required: true
    }
  },
  pricing: {
    baseAmount: {
      type: Number,
      required: true,
      min: 0
    },
    additionalCharges: [{
      description: String,
      amount: {
        type: Number,
        min: 0
      }
    }],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  location: {
    address: {
      type: String,
      required: [true, 'Service address is required']
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    instructions: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'in-progress', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'card'],
    default: 'cash'
  },
  communication: [{
    sender: {
      type: String,
      enum: ['user', 'provider'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: String,
      enum: ['user', 'provider', 'system'],
      required: true
    },
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  completionDetails: {
    completedAt: Date,
    actualDuration: {
      value: Number,
      unit: String
    },
    notes: String,
    images: [String]
  },
  feedback: {
    userRating: {
      type: Number,
      min: 1,
      max: 5
    },
    userReview: String,
    providerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    providerReview: String,
    feedbackDate: Date
  },
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['user', 'provider']
    },
    reason: String,
    cancelledAt: Date,
    refundAmount: {
      type: Number,
      default: 0
    }
  },
  dispute: {
    raisedBy: {
      type: String,
      enum: ['user', 'provider']
    },
    reason: String,
    description: String,
    raisedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'closed'],
      default: 'pending'
    },
    resolution: String,
    resolvedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
serviceRequestSchema.index({ userId: 1, status: 1 });
serviceRequestSchema.index({ providerId: 1, status: 1 });
serviceRequestSchema.index({ serviceCategory: 1 });
serviceRequestSchema.index({ scheduledDate: 1 });
serviceRequestSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to update status history
serviceRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedBy: 'system', // This should be updated by the controller
      timestamp: new Date()
    });
  }
  next();
});

// Method to add communication message
serviceRequestSchema.methods.addMessage = function(sender, message) {
  this.communication.push({
    sender,
    message,
    timestamp: new Date()
  });
  return this.save();
};

// Method to update status with history
serviceRequestSchema.methods.updateStatus = function(newStatus, changedBy, reason) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedBy,
    reason,
    timestamp: new Date()
  });
  return this.save();
};

// Method to calculate total amount
serviceRequestSchema.methods.calculateTotal = function() {
  let total = this.pricing.baseAmount;
  
  if (this.pricing.additionalCharges.length > 0) {
    total += this.pricing.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  }
  
  this.pricing.totalAmount = total;
  return total;
};

// Virtual for service duration in hours
serviceRequestSchema.virtual('durationInHours').get(function() {
  const multipliers = {
    'hours': 1,
    'days': 24,
    'weeks': 168,
    'months': 720 // approximate
  };
  
  return this.duration.value * multipliers[this.duration.unit];
});

// Method to check if service is overdue
serviceRequestSchema.methods.isOverdue = function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  
  const serviceDateTime = new Date(this.scheduledDate);
  const [hours, minutes] = this.scheduledTime.end.split(':');
  serviceDateTime.setHours(parseInt(hours), parseInt(minutes));
  
  return new Date() > serviceDateTime;
};

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);