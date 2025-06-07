const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider',
        required: true
    },
    service: {
        type: {
            type: String,
            enum: ['home-care', 'elderly-care', 'child-care', 'medical-care'],
            required: true
        },
        description: String,
        hourlyRate: {
            type: Number,
            required: true
        }
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    location: {
        address: String,
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                required: true
            }
        }
    },
    notes: String,
    cancellationReason: String,
    rating: {
        score: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        date: Date
    }
}, {
    timestamps: true
});

// Index for geospatial queries
bookingSchema.index({ 'location.coordinates': '2dsphere' });

// Calculate total amount before saving
bookingSchema.pre('save', function(next) {
    if (this.isModified('duration') || this.isModified('service.hourlyRate')) {
        this.totalAmount = this.duration * this.service.hourlyRate;
    }
    next();
});

// Method to check if booking is in the past
bookingSchema.methods.isPast = function() {
    const bookingDateTime = new Date(`${this.date.toISOString().split('T')[0]}T${this.startTime}`);
    return bookingDateTime < new Date();
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
    if (this.status === 'cancelled' || this.status === 'completed') {
        return false;
    }

    const bookingDateTime = new Date(`${this.date.toISOString().split('T')[0]}T${this.startTime}`);
    const hoursUntilBooking = (bookingDateTime - new Date()) / (1000 * 60 * 60);
    
    return hoursUntilBooking >= 24;
};

// Export the model only if it hasn't been compiled yet
module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema); 
const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider',
        required: true
    },
    service: {
        type: {
            type: String,
            enum: ['home-care', 'elderly-care', 'child-care', 'medical-care'],
            required: true
        },
        description: String,
        hourlyRate: Number
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // in hours
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'refunded'],
        default: 'pending'
    },
    location: {
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String
        },
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        }
    },
    notes: String,
    cancellationReason: String,
    rating: {
        score: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        date: Date
    }
}, {
    timestamps: true
});

// Index for geospatial queries
bookingSchema.index({ 'location.coordinates': '2dsphere' });

// Calculate total amount before saving
bookingSchema.pre('save', function(next) {
    if (this.isModified('duration') || this.isModified('service.hourlyRate')) {
        this.totalAmount = this.duration * this.service.hourlyRate;
    }
    next();
});

// Method to check if booking is in the past
bookingSchema.methods.isPast = function() {
    const bookingDateTime = new Date(this.date);
    const [startHours, startMinutes] = this.startTime.split(':');
    bookingDateTime.setHours(parseInt(startHours), parseInt(startMinutes));
    return bookingDateTime < new Date();
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
    const bookingDateTime = new Date(this.date);
    const [startHours, startMinutes] = this.startTime.split(':');
    bookingDateTime.setHours(parseInt(startHours), parseInt(startMinutes));
    const hoursUntilBooking = (bookingDateTime - new Date()) / (1000 * 60 * 60);
    return hoursUntilBooking >= 24 && this.status === 'confirmed';
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 