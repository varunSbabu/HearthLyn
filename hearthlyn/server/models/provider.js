const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const providerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /^\+?[\d\s-()]{10,}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      validate: {
        validator: function(v) {
          return /^\d{6}$/.test(v);
        },
        message: 'Please enter a valid 6-digit pincode'
      }
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  services: [{
    category: {
      type: String,
      required: true,
      enum: ['baby-care', 'tuition', 'tailoring', 'home-food', 'cleaning', 'cooking', 'elderly-care', 'pet-care']
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      unit: {
        type: String,
        required: true,
        enum: ['hour', 'day', 'week', 'month', 'project']
      }
    },
    availability: {
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }],
      timeSlots: [{
        start: String,
        end: String
      }]
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  profileImage: {
    type: String,
    default: null
  },
  documents: {
    aadhar: {
      type: String,
      required: [true, 'Aadhar document is required']
    },
    pan: {
      type: String
    },
    certificates: [String]
  },
  experience: {
    years: {
      type: Number,
      min: 0,
      max: 50
    },
    description: String
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    serviceCategory: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationNotes: String,
  serviceArea: {
    radius: {
      type: Number,
      default: 15 // in kilometers
    }
  },
  completedServices: {
    type: Number,
    default: 0
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true
});

// Index for geospatial queries
providerSchema.index({ "address.coordinates": "2dsphere" });
providerSchema.index({ "services.category": 1 });
providerSchema.index({ "rating.average": -1 });

// Hash password before saving
providerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
providerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update rating method
providerSchema.methods.updateRating = function() {
  if (this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating.average = totalRating / this.reviews.length;
    this.rating.count = this.reviews.length;
  }
};

// Get active services method
providerSchema.methods.getActiveServices = function() {
  return this.services.filter(service => service.isActive);
};

// Remove sensitive data when converting to JSON
providerSchema.methods.toJSON = function() {
  const provider = this.toObject();
  delete provider.password;
  return provider;
};

module.exports = mongoose.model('Provider', providerSchema);