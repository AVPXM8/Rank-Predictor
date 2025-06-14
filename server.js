// =================================================================
// FINAL, COMPLETE, AND CORRECTED SERVER.JS
// =================================================================

// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios'); // For MSG91 or other HTTP requests

// Import Models
const User = require('./models/User');
const Prediction = require('./models/Prediction');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
const PREDICTION_CONFIG = {
    LIMIT_PER_PHONE: 50,
    ADMIN_UNLIMITED: true,
    ADMIN_PHONES: ['9935985550'],
    PREMIUM_USERS: [],
};

// --- HELPER FUNCTIONS ---
function hasUnlimitedAccess(phoneNumber) {
    if (!PREDICTION_CONFIG.ADMIN_UNLIMITED) return false;
    const adminPhones = PREDICTION_CONFIG.ADMIN_PHONES || [];
    const premiumUsers = PREDICTION_CONFIG.PREMIUM_USERS || [];
    return adminPhones.includes(phoneNumber) || premiumUsers.includes(phoneNumber);
}

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((error) => console.error('❌ MongoDB connection error:', error.message));

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));


// =================================================================
// ⭐️ DATA ARRAYS START HERE ⭐️
// =================================================================

const nimcetColleges = [
    // Data updated based on official 2024 Cutoff PDF and your notes
    {
        name: "NIT Trichy (Tiruchirappalli)",
        location: "Tiruchirappalli, Tamil Nadu", type: "NIT", tier: 1,
        cutoffs: { General: { min: 1, max: 52 }, EWS: { min: 1, max: 112 }, OBC: { min: 1, max: 130 }, SC: { min: 1, max: 995 }, ST: { min: 1, max: 3155 }, PWD: { min: 1, max: 9392 } },
        seats: 115,
    },
    {
        name: "MNNIT Allahabad",
        location: "Prayagraj, Uttar Pradesh", type: "NIT", tier: 1,
        cutoffs: { General: { min: 1, max: 181 }, EWS: { min: 1, max: 221 }, OBC: { min: 1, max: 257 }, SC: { min: 1, max: 1678 }, ST: { min: 1, max: 4649 }, PWD: { min: 1, max: 11801 } },
        seats: 116,
    },
    {
        name: "NIT Warangal",
        location: "Warangal, Telangana", type: "NIT", tier: 1,
        cutoffs: { General: { min: 1, max: 243 }, EWS: { min: 1, max: 278 }, OBC: { min: 1, max: 296 }, SC: { min: 1, max: 2034 }, ST: { min: 1, max: 3484 }, PWD: { min: 1, max: 8629 } },
        seats: 58,
    },
    {
        name: "NIT Kurukshetra",
        location: "Kurukshetra, Haryana", type: "NIT", tier: 2,
        cutoffs: { General: { min: 1, max: 297 }, EWS: { min: 1, max: 339 }, OBC: { min: 1, max: 349 }, SC: { min: 1, max: 2521 }, ST: { min: 1, max: 6324 }, PWD: { min: 1, max: 9628 } },
        seats: 64,
    },
    {
        name: "NIT Bhopal (MANIT)",
        location: "Bhopal, Madhya Pradesh", type: "NIT", tier: 2,
        cutoffs: { General: { min: 1, max: 382 }, EWS: { min: 1, max: 451 }, OBC: { min: 1, max: 484 }, SC: { min: 1, max: 2930 }, ST: { min: 1, max: 6429 }, PWD: { min: 1, max: 10244 } },
        seats: 115,
    },
    {
        name: "NIT Jamshedpur",
        location: "Jamshedpur, Jharkhand", type: "NIT", tier: 2,
        cutoffs: { General: { min: 1, max: 464 }, EWS: { min: 1, max: 510 }, OBC: { min: 1, max: 638 }, SC: { min: 1, max: 3377 }, ST: { min: 1, max: 5642 }, PWD: { min: 1, max: 11963 } },
        seats: 115,
    },
    {
        name: "NIT Patna (AI & IoT)",
        location: "Patna, Bihar", type: "NIT", tier: 2,
        cutoffs: { General: { min: 1, max: 557 }, EWS: { min: 1, max: 606 }, OBC: { min: 1, max: 640 }, SC: { min: 1, max: 3394 }, ST: { min: 1, max: 6429 }, PWD: { min: 1, max: 12313 } },
        seats: 40,
    },
    {
        name: "NIT Patna (Data Sciences & Informatics)",
        location: "Patna, Bihar", type: "NIT", tier: 2,
        cutoffs: { General: { min: 1, max: 590 }, EWS: { min: 1, max: 692 }, OBC: { min: 1, max: 675 }, SC: { min: 1, max: 3306 }, ST: { min: 1, max: 7285 }, PWD: { min: 1, max: 12836 } },
        seats: 40,
    },
    {
        name: "IIIT Bhopal",
        location: "Bhopal, Madhya Pradesh", type: "IIIT", tier: 2,
        cutoffs: { General: { min: 1, max: 684 }, EWS: { min: 1, max: 878 }, OBC: { min: 1, max: 954 }, SC: { min: 1, max: 4074 }, ST: { min: 1, max: 7956 }, PWD: { min: 1, max: 10392 } },
        seats: 75,
    },
    {
        name: "NIT Raipur",
        location: "Raipur, Chhattisgarh", type: "NIT", tier: 2,
        cutoffs: { General: { min: 1, max: 736 }, EWS: { min: 1, max: 896 }, OBC: { min: 1, max: 826 }, SC: { min: 1, max: 4250 }, ST: { min: 1, max: 7252 }, PWD: { min: 1, max: 12459 } },
        seats: 110,
    },
    {
        name: "NIT Agartala",
        location: "Agartala, Tripura", type: "NIT", tier: 3,
        cutoffs: { General: { min: 1, max: 819 }, EWS: { min: 1, max: 908 }, OBC: { min: 1, max: 939 }, SC: { min: 1, max: 4663 }, ST: { min: 1, max: 7991 } },
        seats: 60,
    },
    {
        name: "NIT Meghalaya",
        location: "Shillong, Meghalaya", type: "NIT", tier: 3,
        cutoffs: { General: { min: 1, max: 800 }, EWS: { min: 1, max: 960 }, OBC: { min: 1, max: 1200 }, SC: { min: 1, max: 1600 }, ST: { min: 1, max: 2000 } },
        seats: 20,
    },
    {
        name: "IIIT Vadodara (Gandhinagar Campus)",
        location: "Gandhinagar, Gujarat", type: "IIIT", tier: 2,
        cutoffs: { General: { min: 1, max: 1300 }, EWS: { min: 1, max: 1560 }, OBC: { min: 1, max: 1950 }, SC: { min: 1, max: 2600 }, ST: { min: 1, max: 3250 } },
        seats: 120,
    },
    {
        name: "NIT Delhi (Self-Financing)",
        location: "New Delhi, Delhi", type: "NIT-SF", tier: 2,
        cutoffs: { General: { min: 1, max: 120 }, EWS: { min: 1, max: 145 }, OBC: { min: 1, max: 180 }, SC: { min: 1, max: 240 }, ST: { min: 1, max: 300 } },
        seats: 15,
    },
    {
        name: "NIT Kurukshetra (Self-Financing)",
        location: "Kurukshetra, Haryana", type: "NIT-SF", tier: 2,
        cutoffs: { General: { min: 1, max: 399 }, EWS: { min: 1, max: 443 }, OBC: { min: 1, max: 525 }, SC: { min: 1, max: 3512 }, ST: { min: 1, max: 6836 } },
        seats: 42,
    },
    {
        name: "NIT Patna (Data Sci - Self-Financing)",
        location: "Patna, Bihar", type: "NIT-SF", tier: 3,
        cutoffs: { General: { min: 1, max: 804 }, EWS: { min: 1, max: 909 }, OBC: { min: 1, max: 935 }, SC: { min: 1, max: 4811 }, ST: { min: 1, max: 8858 } },
        seats: 40,
    },
    {
        name: "NIT Patna (AI & IoT - Self-Financing)",
        location: "Patna, Bihar", type: "NIT-SF", tier: 3,
        cutoffs: { General: { min: 1, max: 769 }, EWS: { min: 1, max: 828 }, OBC: { min: 1, max: 852 }, SC: { min: 1, max: 4748 }, ST: { min: 1, max: 9104 } },
        seats: 40,
    },
    {
        name: "HCU - Hyderabad Central University",
        location: "Hyderabad, Telangana", type: "University", tier: 2,
        cutoffs: { General: { min: 1, max: 370 }, EWS: { min: 1, max: 350 }, OBC: { min: 1, max: 340 }, SC: { min: 1, max: 200 }, ST: { min: 1, max: 190 }, PWD: { min: 1, max: 190 } },
        seats: 50,
    },
    {
        name: "IPU - Guru Gobind Singh Indraprastha University",
        location: "New Delhi, Delhi", type: "University", tier: 2,
        cutoffs: { General: { min: 1, max: 280 }, EWS: { min: 1, max: 250 }, OBC: { min: 1, max: 250 }, SC: { min: 1, max: 180 }, ST: { min: 1, max: 170 }, PWD: { min: 1, max: 170 } },
        seats: 60,
    },
    {
        name: "HBTU Kanpur",
        location: "Kanpur, Uttar Pradesh", type: "University", tier: 3,
        cutoffs: { General: { min: 1, max: 230 }, EWS: { min: 1, max: 210 }, OBC: { min: 1, max: 215 }, SC: { min: 1, max: 170 }, ST: { min: 1, max: 170 }, PWD: { min: 1, max: 170 } },
        seats: 60,
    },
];

const nimcetRankData = [
    // FINAL, ultra-granular data for the most precise prediction curve
    { minMarks: 600, maxMarks: 1000, minRank: 1, maxRank: 20 },
    { minMarks: 550, maxMarks: 599, minRank: 21, maxRank: 40 },
    { minMarks: 500, maxMarks: 549, minRank: 41, maxRank: 60 },
    { minMarks: 470, maxMarks: 499, minRank: 61, maxRank: 80 },
    { minMarks: 450, maxMarks: 469, minRank: 81, maxRank: 100 },
    { minMarks: 425, maxMarks: 449, minRank: 101, maxRank: 150 },
    { minMarks: 400, maxMarks: 424, minRank: 151, maxRank: 200 },
    { minMarks: 380, maxMarks: 399, minRank: 201, maxRank: 260 },
    { minMarks: 360, maxMarks: 379, minRank: 261, maxRank: 330 },
    { minMarks: 340, maxMarks: 359, minRank: 331, maxRank: 410 },
    { minMarks: 320, maxMarks: 339, minRank: 411, maxRank: 500 },
    { minMarks: 310, maxMarks: 319, minRank: 501, maxRank: 560 },
    { minMarks: 300, maxMarks: 309, minRank: 561, maxRank: 630 },
    { minMarks: 290, maxMarks: 299, minRank: 631, maxRank: 710 },
    { minMarks: 280, maxMarks: 289, minRank: 711, maxRank: 800 },
    { minMarks: 270, maxMarks: 279, minRank: 801, maxRank: 900 },
    { minMarks: 260, maxMarks: 269, minRank: 901, maxRank: 1050 },
    { minMarks: 250, maxMarks: 259, minRank: 1051, maxRank: 1250 },
    { minMarks: 240, maxMarks: 249, minRank: 1251, maxRank: 1500 },
    { minMarks: 230, maxMarks: 239, minRank: 1501, maxRank: 1800 },
    { minMarks: 220, maxMarks: 229, minRank: 1801, maxRank: 2200 },
    { minMarks: 200, maxMarks: 219, minRank: 2201, maxRank: 2800 },
    { minMarks: 180, maxMarks: 199, minRank: 2801, maxRank: 3600 },
    { minMarks: 150, maxMarks: 179, minRank: 3601, maxRank: 5000 },
    { minMarks: 120, maxMarks: 149, minRank: 5001, maxRank: 7000 },
    { minMarks: 100, maxMarks: 119, minRank: 7001, maxRank: 9000 },
    { minMarks: 80, maxMarks: 99, minRank: 9001, maxRank: 11500 },
    { minMarks: 50, maxMarks: 79, minRank: 11501, maxRank: 15000 },
    { minMarks: 0, maxMarks: 49, minRank: 15001, maxRank: 25000 }
];


const getEligibleColleges = (minRank, maxRank, category) => {
    const eligibleColleges = [];
    nimcetColleges.forEach(college => {
        const cutoff = college.cutoffs[category];
        if (cutoff && minRank <= cutoff.max) {
            eligibleColleges.push(college);
        }
    });
    return eligibleColleges.sort((a, b) => a.cutoffs[category].max - b.cutoffs[category].max);
};

// =================================================================
// ⭐️ API ROUTES START HERE ⭐️
// =================================================================

// Simplified "No OTP" login route
app.post('/api/register-guest', async (req, res) => {
    try {
        const { phoneNumber, fullName } = req.body;
        if (!phoneNumber || !fullName || fullName.trim().length < 2 || phoneNumber.length !== 10) {
            return res.status(400).json({ success: false, message: 'Valid phone number and name are required.' });
        }
        let user = await User.findOne({ phoneNumber });
        if (user) {
            user.fullName = fullName.trim();
        } else {
            user = new User({ phoneNumber, fullName: fullName.trim(), isVerified: false });
        }
        user.sessionToken = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        user.lastLoginAt = new Date();
        await user.save();
        res.json({
            success: true, message: `Welcome ${user.fullName}!`, token: user.sessionToken,
            user: { fullName: user.fullName, phoneNumber: user.phoneNumber }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
    }
});

// The main prediction route
app.post('/api/predict-rank', async (req, res) => {
    try {
        const { marks, category, token } = req.body;
        if (!marks || !category || !token) {
            return res.status(400).json({ success: false, message: 'Marks, category, and token are required' });
        }
        
        const user = await User.findOne({ sessionToken: token });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized or session expired. Please login again.' });
        }
        
        const existingPredictions = await Prediction.countDocuments({ userId: user._id });
        if (!hasUnlimitedAccess(user.phoneNumber) && existingPredictions >= PREDICTION_CONFIG.LIMIT_PER_PHONE) {
            return res.status(429).json({ success: false, message: `Prediction limit of ${PREDICTION_CONFIG.LIMIT_PER_PHONE} reached.` });
        }

        // Step 1: Find the Common Rank based only on marks
        const prediction = nimcetRankData.find(p => marks >= p.minMarks && marks <= p.maxMarks);
        
        if (!prediction) {
            return res.json({ success: false, message: `No rank prediction available for ${marks} marks.` });
        }
        
        // Step 2: Use the predicted rank AND the user's category to find colleges
        const eligibleColleges = getEligibleColleges(prediction.minRank, prediction.maxRank, category);
        
        const newPrediction = new Prediction({
            userId: user._id,
            userDetails: { fullName: user.fullName, phoneNumber: user.phoneNumber },
            marks: parseInt(marks),
            category,
            predictedMinRank: prediction.minRank,
            predictedMaxRank: prediction.maxRank,
            eligibleColleges: eligibleColleges.length,
        });
        await newPrediction.save();
        
        res.json({
            success: true,
            prediction: {
                marks: parseInt(marks),
                category,
                rankRange: { min: prediction.minRank, max: prediction.maxRank },
                colleges: eligibleColleges,
            },
        });
        
    } catch (error) {
        console.error('Predict Rank Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to predict rank.' });
    }
});

// --- Fallback and Server Start ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});