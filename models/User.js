const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        validate: {
            validator: function(v) {
                return /^[6-9]\d{9}$/.test(v);
            },
            message: 'Please enter a valid mobile number'
        }
    },
    sessionToken: {
        type: String,
        required: false
    },
    verifiedAt: {
        type: Date,
        required: false
    },
    lastLoginAt: {
        type: Date,
        required: false
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

userSchema.index({ sessionToken: 1 });

module.exports = mongoose.model('User', userSchema);