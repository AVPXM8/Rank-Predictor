// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const twilio = require('twilio');

// Import Models
const User = require('./models/User');
const Prediction = require('./models/Prediction');

const app = express();
const PORT = process.env.PORT || 3000;

// 🎯 PREDICTION LIMIT CONFIGURATION
const PREDICTION_CONFIG = {
    LIMIT_PER_PHONE: 50, // Change to 2 for 2 predictions limit
    ADMIN_UNLIMITED: true, // Admins get unlimited predictions
    RESET_DAILY: false, // Set to true for daily reset (future feature)
    PREMIUM_USERS: [], // Phone numbers with unlimited access (future feature)
};

// Helper function to check if user has unlimited access
function hasUnlimitedAccess(phoneNumber) {
    return PREDICTION_CONFIG.ADMIN_UNLIMITED && 
           (phoneNumber === '9935985550' || // Your number
            PREDICTION_CONFIG.PREMIUM_USERS.includes(phoneNumber));
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nimcet-predictor', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB');
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('📝 Make sure MongoDB is running locally or check your MONGODB_URI');
});

// Twilio Configuration
// const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
//     ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
//     : null;

// const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
// const SMS_ENABLED = ()=>{
//     if (process.env.SMS_ENABLED === 'true') {
//   // Send SMS via Twilio
// } else {
//   console.log(`📱 SMS DISABLED - Would send to ${phoneNumber}: ${otp}`);
// }
// }
// const SMS_ENABLED = process.env.SMS_ENABLED === 'true' && twilioClient;

// 1. Import and configure Twilio if credentials are available

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const SMS_ENABLED = process.env.SMS_ENABLED === 'true' && twilioClient !== null;

// 2. Define function to send SMS
async function sendOTP(phoneNumber, otp) {
  if (!SMS_ENABLED) {
    console.log(`📱 SMS DISABLED - Would send to ${phoneNumber}: Your OTP is ${otp}`);
    return;
  }

  try {
    await twilioClient.messages.create({
      body: `Your Maarula Classes Rank Predictor OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    console.log(`✅ OTP sent to ${phoneNumber}`);
  } catch (err) {
    console.error(`❌ Failed to send OTP to ${phoneNumber}:`, err);
  }
}


console.log('🔧 Configuration Status:');
console.log('- MongoDB:', mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting...');
console.log('- Twilio SMS:', SMS_ENABLED ? '✅ Enabled' : '❌ Disabled');

// SMS Function
const sendSMS = async (phoneNumber, message) => {
    try {
        if (!SMS_ENABLED) {
            console.log(`📱 SMS DISABLED - Would send to ${phoneNumber}: ${message}`);
            return { success: true, method: 'console' };
        }

        const result = await twilioClient.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: `+91${phoneNumber}`
        });

        console.log(`✅ SMS sent successfully to ${phoneNumber} - SID: ${result.sid}`);
        return { success: true, sid: result.sid, method: 'twilio' };
        
    } catch (error) {
        console.error(`❌ SMS failed for ${phoneNumber}:`, error.message);
        console.log(`📱 FALLBACK - OTP for ${phoneNumber}: ${message.split(': ')[1].split('.')[0]}`);
        return { success: false, error: error.message, method: 'fallback' };
    }
};

// Helper functions
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// NIMCET Colleges Data - 13 Colleges with Real Seats & Fees
const nimcetColleges = [
    // 1. NIT Trichy - Under 100 Rank
    {
        name: "NIT Trichy (National Institute of Technology, Tiruchirappalli)",
        location: "Tiruchirappalli, Tamil Nadu",
        type: "NIT",
        tier: 1,
        cutoffs: {
            General: { min: 1, max: 100 },
            EWS: { min: 1, max: 120 },
            OBC: { min: 1, max: 150 },
            SC: { min: 1, max: 200 },
            ST: { min: 1, max: 250 },
            PWD: { min: 1, max: 180 }
        },
        fees: "₹2.10 Lakhs (Total Program)",
        duration: "3 Years",
        seats: 115, // From seat matrix document
        highlights: ["Top NIT for MCA", "Excellent Placement Record", "Industry Partnerships"]
    },

    // 2. NIT Delhi - Under 120 Rank
    {
        name: "NIT Delhi (National Institute of Technology Delhi)",
        location: "New Delhi, Delhi",
        type: "NIT",
        tier: 1,
        cutoffs: {
            General: { min: 1, max: 120 },
            EWS: { min: 1, max: 145 },
            OBC: { min: 1, max: 180 },
            SC: { min: 1, max: 240 },
            ST: { min: 1, max: 300 },
            PWD: { min: 1, max: 220 }
        },
        fees: "₹2.10 Lakhs (Total Program)",
        duration: "3 Years",
        seats: 10, // From seat matrix document
        highlights: ["Capital Location", "Top Industry Exposure", "Metro Connectivity"]
    },

    // 3. NIT Warangal - Under 200 Rank
    {
        name: "NIT Warangal (National Institute of Technology, Warangal)",
        location: "Warangal, Telangana",
        type: "NIT",
        tier: 1,
        cutoffs: {
            General: { min: 1, max: 200 },
            EWS: { min: 1, max: 240 },
            OBC: { min: 1, max: 300 },
            SC: { min: 1, max: 400 },
            ST: { min: 1, max: 500 },
            PWD: { min: 1, max: 360 }
        },
        // fees: "₹2.10 Lakhs (Total Program)",
        // duration: "3 Years",
        // seats: 58, // From seat matrix document
        // highlights: ["Research Excellence", "Strong Alumni Network", "Tech Giants Recruitment"]
    },

    // 4. NIT Allahabad - Under 250 Rank
    {
        name: "NIT Allahabad (Motilal Nehru National Institute of Technology)",
        location: "Prayagraj, Uttar Pradesh",
        type: "NIT",
        tier: 1,
        cutoffs: {
            General: { min: 120, max: 250 },
            EWS: { min: 150, max: 300 },
            OBC: { min: 180, max: 375 },
            SC: { min: 240, max: 500 },
            ST: { min: 300, max: 625 },
            PWD: { min: 200, max: 450 }
        },
        // fees: "₹2.10 Lakhs (Total Program)",
        // duration: "3 Years",
        // seats: 116, // From seat matrix document
        // highlights: ["Historic Institution", "Strong Faculty", "Good Placement Support"]
    },

    // 5. NIT Bhopal - Under 350 Rank
    {
        name: "NIT Bhopal (Maulana Azad National Institute of Technology)",
        location: "Bhopal, Madhya Pradesh",
        type: "NIT",
        tier: 2,
        cutoffs: {
            General: { min: 200, max: 350 },
            EWS: { min: 240, max: 420 },
            OBC: { min: 300, max: 525 },
            SC: { min: 400, max: 700 },
            ST: { min: 500, max: 875 },
            PWD: { min: 350, max: 630 }
        },
        // fees: "₹2.77 Lakhs (Total Program)",
        // duration: "3 Years",
        // seats: 115, // From seat matrix document
        // highlights: ["Central Location", "Growing Reputation", "Affordable Fees"]
    },

    // 6. NIT Kurukshetra - Under 400 Rank
    {
        name: "NIT Kurukshetra (National Institute of Technology Kurukshetra)",
        location: "Kurukshetra, Haryana",
        type: "NIT",
        tier: 2,
        cutoffs: {
            General: { min: 250, max: 400 },
            EWS: { min: 300, max: 480 },
            OBC: { min: 375, max: 600 },
            SC: { min: 500, max: 800 },
            ST: { min: 625, max: 1000 },
            PWD: { min: 450, max: 720 }
        },
        // fees: "₹2.10 Lakhs (Total Program)",
        // duration: "3 Years",
        // seats: 64, // From seat matrix document
        // highlights: ["NCR Proximity", "Good Connectivity", "Emerging Programs"]
    },

    // 7. NIT Patna - Under 450 Rank
    {
        name: "NIT Patna (National Institute of Technology Patna) - Data Sciences & Informatics",
        location: "Patna, Bihar",
        type: "NIT",
        tier: 2,
        cutoffs: {
            General: { min: 300, max: 450 },
            EWS: { min: 360, max: 540 },
            OBC: { min: 450, max: 675 },
            SC: { min: 600, max: 900 },
            ST: { min: 750, max: 1125 },
            PWD: { min: 540, max: 810 }
        },
        // fees: "₹3.00 Lakhs (Total Program)",
        // duration: "3 Years",
        // seats: 40, // From seat matrix document
        // highlights: ["Data Sciences Focus", "Growing Placement", "Specialized Program"]
    },

    // 8. NIT Jamshedpur - Under 550 Rank
    {
        name: "NIT Jamshedpur (National Institute of Technology Jamshedpur)",
        location: "Jamshedpur, Jharkhand",
        type: "NIT",
        tier: 2,
        cutoffs: {
            General: { min: 350, max: 550 },
            EWS: { min: 420, max: 660 },
            OBC: { min: 525, max: 825 },
            SC: { min: 700, max: 1100 },
            ST: { min: 875, max: 1375 },
            PWD: { min: 630, max: 990 }
        },
        // fees: "₹2.10 Lakhs (Total Program)",
        // duration: "3 Years",
        // seats: 115, // From seat matrix document
        // highlights: ["Steel City", "Industrial Exposure", "Hands-on Learning"]
    },

    // 9. NIT Raipur - Under 650 Rank
    {
        name: "NIT Raipur (National Institute of Technology Raipur)",
        location: "Raipur, Chhattisgarh",
        type: "NIT",
        tier: 2,
        cutoffs: {
            General: { min: 450, max: 650 },
            EWS: { min: 540, max: 780 },
            OBC: { min: 675, max: 975 },
            SC: { min: 900, max: 1300 },
            ST: { min: 1125, max: 1625 },
            PWD: { min: 810, max: 1170 }
        },
        // fees: "₹2.10 Lakhs (Total Program)",
        // duration: "3 Years",
        // seats: 110, // From seat matrix document
        // highlights: ["Emerging NIT", "Good Infrastructure", "Industry Connect"]
    },

    // 10. NIT Meghalaya - Under 800 Rank
    {
        name: "NIT Meghalaya (National Institute of Technology Meghalaya)",
        location: "Shillong, Meghalaya",
        type: "NIT",
        tier: 3,
        cutoffs: {
            General: { min: 550, max: 800 },
            EWS: { min: 660, max: 960 },
            OBC: { min: 825, max: 1200 },
            SC: { min: 1100, max: 1600 },
            ST: { min: 1375, max: 2000 },
            PWD: { min: 990, max: 1440 }
        },
        // fees: "₹2.10 Lakhs (Total Program)",
        // duration: "3 Years",
        // seats: 20, // From seat matrix document
        // highlights: ["Northeast Hub", "Scenic Location", "Lower Competition"]
    },

    // 11. NIT Agartala - Under 850 Rank
    {
        name: "NIT Agartala (National Institute of Technology Agartala)",
        location: "Agartala, Tripura",
        type: "NIT",
        tier: 3,
        cutoffs: {
            General: { min: 650, max: 850 },
            EWS: { min: 780, max: 1020 },
            OBC: { min: 975, max: 1275 },
            SC: { min: 1300, max: 1700 },
            ST: { min: 1625, max: 2125 },
            PWD: { min: 1170, max: 1530 }
        },
        // fees: "₹2.54 Lakhs (Total Program)",
        // duration: "3 Years",
        // seats: 60, // From seat matrix document
        // highlights: ["Border State", "Cultural Diversity", "Emerging Institute"]
    },

    // 12. IIIT Bhopal - Under 1100 Rank
    {
        name: "IIIT Bhopal (Indian Institute of Information Technology Bhopal)",
        location: "Bhopal, Madhya Pradesh",
        type: "IIIT",
        tier: 2,
        cutoffs: {
            General: { min: 700, max: 1100 },
            EWS: { min: 840, max: 1320 },
            OBC: { min: 1050, max: 1650 },
            SC: { min: 1400, max: 2200 },
            ST: { min: 1750, max: 2750 },
            PWD: { min: 1260, max: 1980 }
        },
        // fees: "₹6.93 Lakhs (Total Program)",
        // duration: "3 Years",
        // seats: 75, // From seat matrix document
        // highlights: ["IT Focused", "Modern Curriculum", "Industry Partnerships"]
    },

    // 13. IIIT Vadodara - Under 1300 Rank
    {
        name: "IIIT Vadodara (Indian Institute of Information Technology Vadodara)",
        location: "Vadodara, Gujarat",
        type: "IIIT",
        tier: 2,
        cutoffs: {
            General: { min: 900, max: 1300 },
            EWS: { min: 1080, max: 1560 },
            OBC: { min: 1350, max: 1950 },
            SC: { min: 1800, max: 2600 },
            ST: { min: 2250, max: 3250 },
            PWD: { min: 1620, max: 2340 }
        },
        // fees: "₹7.50 Lakhs (Total Program)",
        // duration: "3 Years",
        // seats: 120, // From seat matrix document (Gandhinagar Campus)
        // highlights: ["Gujarat Location", "Technology Focus", "Growing Reputation"]
    }
];


// NIMCET rank prediction data (CORRECTED VERSION)
const nimcetRankData = [
    // General Category
    { minMarks: 500, maxMarks: 1000, minRank: 1, maxRank: 10, category: 'General' },
    { minMarks: 450, maxMarks: 499, minRank: 11, maxRank: 50, category: 'General' },
    { minMarks: 350, maxMarks: 449, minRank: 51, maxRank: 150, category: 'General' },
    { minMarks: 300, maxMarks: 349, minRank: 151, maxRank: 300, category: 'General' },
    { minMarks: 270, maxMarks: 299, minRank: 301, maxRank: 500, category: 'General' },
    { minMarks: 250, maxMarks: 269, minRank: 501, maxRank: 800, category: 'General' },
    { minMarks: 230, maxMarks: 249, minRank: 801, maxRank: 1200, category: 'General' },
    { minMarks: 200, maxMarks: 229, minRank: 1201, maxRank: 1800, category: 'General' },
    { minMarks: 180, maxMarks: 199, minRank: 1801, maxRank: 2500, category: 'General' },
    { minMarks: 150, maxMarks: 179, minRank: 2501, maxRank: 3500, category: 'General' },
    { minMarks: 120, maxMarks: 149, minRank: 3501, maxRank: 5000, category: 'General' },
    { minMarks: 100, maxMarks: 119, minRank: 5001, maxRank: 7000, category: 'General' },
  
    // OBC Category
    { minMarks: 450, maxMarks: 1000, minRank: 1, maxRank: 10, category: 'OBC' },
    { minMarks: 400, maxMarks: 449, minRank: 11, maxRank: 50, category: 'OBC' },
    { minMarks: 320, maxMarks: 399, minRank: 51, maxRank: 150, category: 'OBC' },
    { minMarks: 280, maxMarks: 319, minRank: 151, maxRank: 300, category: 'OBC' },
    { minMarks: 250, maxMarks: 279, minRank: 301, maxRank: 500, category: 'OBC' },
    { minMarks: 220, maxMarks: 249, minRank: 501, maxRank: 800, category: 'OBC' },
    { minMarks: 200, maxMarks: 219, minRank: 801, maxRank: 1200, category: 'OBC' },
    { minMarks: 190, maxMarks: 199, minRank: 1201, maxRank: 1800, category: 'OBC' },
    { minMarks: 170, maxMarks: 189, minRank: 1801, maxRank: 2500, category: 'OBC' },
    { minMarks: 140, maxMarks: 169, minRank: 2501, maxRank: 3500, category: 'OBC' },
    { minMarks: 110, maxMarks: 139, minRank: 3501, maxRank: 5000, category: 'OBC' },
    { minMarks: 90, maxMarks: 109, minRank: 5001, maxRank: 7000, category: 'OBC' },

    // EWS Category
    { minMarks: 450, maxMarks: 1000, minRank: 1, maxRank: 10, category: 'EWS' },
    { minMarks: 400, maxMarks: 449, minRank: 11, maxRank: 50, category: 'EWS' },
    { minMarks: 320, maxMarks: 399, minRank: 51, maxRank: 150, category: 'EWS' },
    { minMarks: 280, maxMarks: 319, minRank: 151, maxRank: 300, category: 'EWS' },
    { minMarks: 250, maxMarks: 279, minRank: 301, maxRank: 500, category: 'EWS' },
    { minMarks: 220, maxMarks: 249, minRank: 501, maxRank: 800, category: 'EWS' },
    { minMarks: 200, maxMarks: 219, minRank: 801, maxRank: 1200, category: 'EWS' },
    { minMarks: 190, maxMarks: 199, minRank: 1201, maxRank: 1800, category: 'EWS' },
    { minMarks: 170, maxMarks: 189, minRank: 1801, maxRank: 2500, category: 'EWS' },
    { minMarks: 140, maxMarks: 169, minRank: 2501, maxRank: 3500, category: 'EWS' },
    { minMarks: 110, maxMarks: 139, minRank: 3501, maxRank: 5000, category: 'EWS' },
    { minMarks: 90, maxMarks: 109, minRank: 5001, maxRank: 7000, category: 'EWS' },

    // SC Category
    { minMarks: 250, maxMarks: 1000, minRank: 1, maxRank: 10, category: 'SC' },
    { minMarks: 200, maxMarks: 249, minRank: 11, maxRank: 50, category: 'SC' },
    { minMarks: 185, maxMarks: 199, minRank: 51, maxRank: 150, category: 'SC' },
    { minMarks: 170, maxMarks: 184, minRank: 151, maxRank: 300, category: 'SC' },
    { minMarks: 150, maxMarks: 169, minRank: 301, maxRank: 500, category: 'SC' },
    { minMarks: 120, maxMarks: 149, minRank: 501, maxRank: 800, category: 'SC' },
    { minMarks: 100, maxMarks: 119, minRank: 801, maxRank: 1200, category: 'SC' },
    { minMarks: 90, maxMarks: 99, minRank: 1201, maxRank: 1800, category: 'SC' },
    { minMarks: 70, maxMarks: 89, minRank: 1801, maxRank: 2500, category: 'SC' },
    { minMarks: 40, maxMarks: 69, minRank: 2501, maxRank: 3500, category: 'SC' },
    { minMarks: 30, maxMarks: 39, minRank: 3501, maxRank: 5000, category: 'SC' },
    { minMarks: 20, maxMarks: 29, minRank: 5001, maxRank: 7000, category: 'SC' },

    // ST Category
    { minMarks: 230, maxMarks: 1000, minRank: 1, maxRank: 10, category: 'ST' },
    { minMarks: 190, maxMarks: 229, minRank: 11, maxRank: 50, category: 'ST' },
    { minMarks: 150, maxMarks: 189, minRank: 51, maxRank: 150, category: 'ST' },
    { minMarks: 140, maxMarks: 149, minRank: 151, maxRank: 300, category: 'ST' },
    { minMarks: 130, maxMarks: 139, minRank: 301, maxRank: 500, category: 'ST' },
    { minMarks: 120, maxMarks: 129, minRank: 501, maxRank: 800, category: 'ST' },
    { minMarks: 100, maxMarks: 119, minRank: 801, maxRank: 1200, category: 'ST' },
    { minMarks: 90, maxMarks: 99, minRank: 1201, maxRank: 1800, category: 'ST' },
    { minMarks: 70, maxMarks: 89, minRank: 1801, maxRank: 2500, category: 'ST' },
    { minMarks: 40, maxMarks: 69, minRank: 2501, maxRank: 3500, category: 'ST' },
    { minMarks: 30, maxMarks: 39, minRank: 3501, maxRank: 5000, category: 'ST' },
    { minMarks: 20, maxMarks: 29, minRank: 5001, maxRank: 7000, category: 'ST' },

    // PWD Category - FIXED TECHNICAL ERRORS
    { minMarks: 370, maxMarks: 819, minRank: 1, maxRank: 10, category: 'PWD' },
    { minMarks: 350, maxMarks: 369, minRank: 11, maxRank: 50, category: 'PWD' },
    { minMarks: 320, maxMarks: 349, minRank: 51, maxRank: 100, category: 'PWD' },
    { minMarks: 300, maxMarks: 319, minRank: 101, maxRank: 150, category: 'PWD' },
    { minMarks: 280, maxMarks: 299, minRank: 151, maxRank: 200, category: 'PWD' },
    { minMarks: 260, maxMarks: 279, minRank: 201, maxRank: 250, category: 'PWD' },
    { minMarks: 240, maxMarks: 259, minRank: 251, maxRank: 300, category: 'PWD' },
    { minMarks: 220, maxMarks: 239, minRank: 301, maxRank: 350, category: 'PWD' },
    { minMarks: 200, maxMarks: 219, minRank: 351, maxRank: 400, category: 'PWD' },
    { minMarks: 180, maxMarks: 199, minRank: 401, maxRank: 450, category: 'PWD' },
    { minMarks: 160, maxMarks: 179, minRank: 451, maxRank: 500, category: 'PWD' },
    { minMarks: 140, maxMarks: 159, minRank: 501, maxRank: 550, category: 'PWD' },
    { minMarks: 120, maxMarks: 139, minRank: 551, maxRank: 600, category: 'PWD' },
    { minMarks: 100, maxMarks: 119, minRank: 601, maxRank: 650, category: 'PWD' },
    { minMarks: 80, maxMarks: 99, minRank: 651, maxRank: 700, category: 'PWD' },
    { minMarks: 60, maxMarks: 79, minRank: 701, maxRank: 20000, category: 'PWD' }
];

// Function to get eligible colleges based on rank and category (UPDATED - 80% minimum chance)
const getEligibleColleges = (minRank, maxRank, category) => {
    const eligibleColleges = [];
    
    nimcetColleges.forEach(college => {
        const cutoff = college.cutoffs[category];
        if (cutoff) {
            // Check if user's rank range overlaps with college cutoff
            if (minRank <= cutoff.max && maxRank >= cutoff.min) {
                const chance = calculateChance(minRank, maxRank, cutoff.min, cutoff.max);
                
                // 🎯 ONLY SHOW COLLEGES WITH 80% OR HIGHER CHANCE
                if (chance >= 80) {
                    eligibleColleges.push({
                        ...college,
                        chance,
                        cutoffRange: `${cutoff.min} - ${cutoff.max}`,
                        userRank: `${minRank} - ${maxRank}`,
                        chanceText: `${chance}% chance of admission`
                    });
                }
            }
        }
    });
    
    // Sort by chance (High to Low) and then by tier
    return eligibleColleges.sort((a, b) => {
        if (b.chance !== a.chance) return b.chance - a.chance;
        return a.tier - b.tier;
    });
};

// Function to calculate admission chances
const calculateChance = (userMinRank, userMaxRank, collegeMinRank, collegeMaxRank) => {
    // If user's best rank is better than college's worst cutoff - High chance
    if (userMinRank <= collegeMaxRank * 0.5) return 90;
    
    // If user's best rank is within college range - Good chance
    if (userMinRank <= collegeMaxRank) return 75;
    
    // If user's worst rank is within college range - Moderate chance
    if (userMaxRank <= collegeMaxRank) return 60;
    
    // If there's any overlap - Low chance
    if (userMinRank <= collegeMaxRank && userMaxRank >= collegeMinRank) return 40;
    
    // No chance
    return 0;
};

// Routes

// Send OTP Route (Updated for MongoDB)
app.post('/api/send-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        // Validate phone number
        if (!phoneNumber || phoneNumber.length !== 10) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid 10-digit phone number' 
            });
        }
        
        if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid Indian mobile number' 
            });
        }
        
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        // Find or create user
        let user = await User.findOne({ phoneNumber });
        
        if (user) {
            // Update existing user
            user.otp = otp;
            user.otpExpiry = otpExpiry;
            user.isVerified = false;
            await user.save();
        } else {
            // Create new user (without full name for now)
            user = new User({
                phoneNumber,
                otp,
                otpExpiry,
                isVerified: false,
                fullName: 'Pending' // Will be updated during verification
            });
            await user.save();
        }
        
        // Send SMS
        const smsMessage = `Your Maarula Classes Rank Predictor OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
        const smsResult = await sendSMS(phoneNumber, smsMessage);
        
        res.json({
            success: true,
            message: smsResult.method === 'twilio' 
                ? 'OTP sent to your mobile number' 
                : 'OTP generated successfully',
            requiresName: !user.fullName || user.fullName === 'Pending',
            expiresIn: '10 minutes'
        });
        
    } catch (error) {
        console.error('Send OTP Error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send OTP. Please try again.'
        });
    }
});

// Verify OTP Route (Updated with Full Name)
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { phoneNumber, otp, fullName } = req.body;
        
        // Validate input
        if (!phoneNumber || !otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number and OTP are required' 
            });
        }
        
        // Find user
        const user = await User.findOne({ phoneNumber });
        
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number not found. Please request OTP first.' 
            });
        }
        
        // Check OTP
        if (user.otp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP. Please check and try again.' 
            });
        }
        
        // Check expiry
        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP expired. Please request a new one.' 
            });
        }
        
        // Validate full name if provided
        if (fullName) {
            if (fullName.trim().length < 2) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Please enter your full name (minimum 2 characters)' 
                });
            }
            user.fullName = fullName.trim();
        }
        
        // Check if name is required but not provided
        if (!user.fullName || user.fullName === 'Pending') {
            if (!fullName) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Full name is required',
                    requiresName: true
                });
            }
        }
        
        // Mark as verified
        user.isVerified = true;
        user.sessionToken = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        user.verifiedAt = new Date();
        user.lastLoginAt = new Date();
        user.otp = undefined; // Clear OTP for security
        user.otpExpiry = undefined;
        
        await user.save();
        
        res.json({
            success: true,
            message: `Welcome ${user.fullName}! Phone verified successfully.`,
            token: user.sessionToken,
            userId: user._id,
            user: {
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                memberSince: user.createdAt
            }
        });
        
    } catch (error) {
        console.error('Verify OTP Error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to verify OTP. Please try again.'
        });
    }
});

// Predict Rank Route (Updated for MongoDB)
// Predict Rank Route (Updated with Prediction Limits)
app.post('/api/predict-rank', async (req, res) => {
    try {
        const { marks, category, token } = req.body;
        
        // Validate input
        if (!marks || !category || !token) {
            return res.status(400).json({ 
                success: false, 
                message: 'Marks, category, and token are required' 
            });
        }
        
        if (marks < 0 || marks > 1000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Marks must be between 0 and 1000' 
            });
        }
        
        // Verify user
        const user = await User.findOne({ sessionToken: token, isVerified: true });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized or session expired. Please login again.' 
            });
        }
        
        // 🚨 CHECK PREDICTION LIMIT (NEW FEATURE)
        // 🆕 UPDATED: CHECK PREDICTION LIMIT (CONFIGURABLE)
                const PREDICTION_LIMIT = PREDICTION_CONFIG.LIMIT_PER_PHONE;
                const existingPredictions = await Prediction.countDocuments({ userId: user._id });


                if (!hasUnlimitedAccess(user.phoneNumber) && existingPredictions >=       PREDICTION_LIMIT) {
                return res.status(429).json({ // 429 = Too Many Requests
                success: false, 
                message: `Prediction limit reached! You have used all ${PREDICTION_LIMIT} predictions for this number.`,
                errorType: 'LIMIT_REACHED',
                details: {
                    predictionsUsed: existingPredictions,
                    predictionsAllowed: PREDICTION_LIMIT,
                    phoneNumber: user.phoneNumber,
                    suggestion: 'Use a different phone number to get more predictions'
                }
            });
        }
        
        // Find rank prediction (existing code)
        const prediction = nimcetRankData.find(p => 
            marks >= p.minMarks && marks <= p.maxMarks && p.category === category
        );
        
        if (!prediction) {
            return res.json({
                success: false,
                message: `No prediction available for ${marks} marks in ${category} category. Please check your marks.`
            });
        }
        
        // Get eligible colleges
        const eligibleColleges = getEligibleColleges(prediction.minRank, prediction.maxRank, category);
        
        // Calculate additional statistics
        const percentage = ((marks / 1000) * 100).toFixed(2);
        const totalCandidates = 200000;
        const percentile = (((totalCandidates - prediction.maxRank) / totalCandidates) * 100).toFixed(2);
        
        // Save prediction to MongoDB
        const newPrediction = new Prediction({
            userId: user._id,
            userDetails: {
                fullName: user.fullName,
                phoneNumber: user.phoneNumber
            },
            marks: parseInt(marks),
            category,
            predictedMinRank: prediction.minRank,
            predictedMaxRank: prediction.maxRank,
            eligibleColleges: eligibleColleges.length,
            additionalInfo: {
                percentage: parseFloat(percentage),
                percentile: parseFloat(percentile),
                candidatesAhead: prediction.maxRank - 1,
                candidatesBehind: totalCandidates - prediction.minRank
            }
        });
        
        await newPrediction.save();
        
        // Calculate remaining predictions
        const remainingPredictions = PREDICTION_LIMIT - (existingPredictions + 1);
        
        res.json({
            success: true,
            prediction: {
                marks: parseInt(marks),
                category,
                rankRange: {
                    min: prediction.minRank,
                    max: prediction.maxRank
                },
                message: `Hi ${user.fullName}! Your predicted NIMCET rank is between ${prediction.minRank.toLocaleString()} and ${prediction.maxRank.toLocaleString()}`,
                additionalInfo: {
                    totalMarks: 1000,
                    percentage: percentage,
                    percentile: percentile,
                    examName: 'NIMCET 2024',
                    candidatesAhead: prediction.maxRank - 1,
                    candidatesBehind: totalCandidates - prediction.minRank
                },
                colleges: eligibleColleges,
                statistics: {
                    totalColleges: nimcetColleges.length,
                    eligibleColleges: eligibleColleges.length,
                    highChanceColleges: eligibleColleges.filter(c => c.chance >= 75).length,
                    moderateChanceColleges: eligibleColleges.filter(c => c.chance >= 50 && c.chance < 75).length,
                    lowChanceColleges: eligibleColleges.filter(c => c.chance < 50).length
                }
            },
            // NEW: Prediction Usage Info
            usageInfo: {
                predictionsUsed: existingPredictions + 1,
                predictionsRemaining: remainingPredictions,
                totalAllowed: PREDICTION_LIMIT,
                phoneNumber: user.phoneNumber.replace(/(.{3})(.{3})(.{4})/, '$1***$3') // Masked phone number
            }
        });
        
    } catch (error) {
        console.error('Predict Rank Error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to predict rank. Please try again.'
        });
    }
});

// Get all colleges (for reference)
app.get('/api/colleges', (req, res) => {
    try {
        const { category, tier, limit } = req.query;
        let filteredColleges = [...nimcetColleges];
        
        // Filter by tier if specified
        if (tier && tier !== 'all') {
            filteredColleges = filteredColleges.filter(college => college.tier.toString() === tier);
        }
        
        // Add cutoff information for specified category
        if (category) {
            filteredColleges = filteredColleges.map(college => ({
                ...college,
                categorySpecificCutoff: college.cutoffs[category] || null
            }));
        }
        
        // Limit results if specified
        if (limit) {
            filteredColleges = filteredColleges.slice(0, parseInt(limit));
        }
        
        res.json({ 
            success: true, 
            colleges: filteredColleges,
                        total: filteredColleges.length,
            totalAvailable: nimcetColleges.length
        });
    } catch (error) {
        console.error('Get Colleges Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch colleges' });
    }
});


app.get('/api/user/prediction-limit', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({ success: false, message: 'Token is required' });
        }
        
        const user = await User.findOne({ sessionToken: token, isVerified: true });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const PREDICTION_LIMIT = PREDICTION_CONFIG.LIMIT_PER_PHONE; // Use config
        const predictionsUsed = await Prediction.countDocuments({ userId: user._id });
        const remainingPredictions = Math.max(0, PREDICTION_LIMIT - predictionsUsed);
        
        res.json({
            success: true,
            usageInfo: {
                predictionsUsed: predictionsUsed,
                predictionsRemaining: remainingPredictions,
                totalAllowed: PREDICTION_LIMIT,
                canPredict: remainingPredictions > 0,
                phoneNumber: user.phoneNumber.replace(/(.{3})(.{3})(.{4})/, '$1***$3'),
                user: user.fullName
            }
        });
        
    } catch (error) {
        console.error('Check Limit Error:', error);
        res.status(500).json({ success: false, error: 'Failed to check prediction limit' });
    }
});

app.get('/api/user/predictions', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({ success: false, message: 'Token is required' });
        }
        
        const user = await User.findOne({ sessionToken: token, isVerified: true });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const userPredictions = await Prediction.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .populate('userId', 'fullName phoneNumber createdAt');
        
        res.json({
            success: true,
            predictions: userPredictions,
            total: userPredictions.length,
            user: {
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                memberSince: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get User Predictions Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch predictions' });
    }
});

// Admin endpoint to get all predictions (Updated for MongoDB)
app.get('/api/admin/predictions', async (req, res) => {
    try {
        const { adminKey } = req.query;
        
        // Simple admin authentication
        if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'admin123') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const predictions = await Prediction.find().populate('userId', 'fullName phoneNumber createdAt');
        const users = await User.find();
        
        // Calculate statistics
        const stats = {
            totalPredictions: predictions.length,
            totalUsers: users.length,
            verifiedUsers: users.filter(u => u.isVerified).length,
            categoriesBreakdown: {},
            marksDistribution: {},
            recentActivity: predictions.slice(-10)
        };
        
        // Calculate category breakdown
        predictions.forEach(p => {
            stats.categoriesBreakdown[p.category] = (stats.categoriesBreakdown[p.category] || 0) + 1;
        });
        
        // Calculate marks distribution
        predictions.forEach(p => {
            const marksRange = Math.floor(p.marks / 100) * 100;
            const rangeLabel = `${marksRange}-${marksRange + 99}`;
            stats.marksDistribution[rangeLabel] = (stats.marksDistribution[rangeLabel] || 0) + 1;
        });
        
        res.json({ 
            success: true, 
            predictions,
            statistics: stats
        });
    } catch (error) {
        console.error('Admin Predictions Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch admin data' });
    }
});

app.post('/api/logout', async (req, res) => {
    try {
        const { token } = req.body;
        
        const user = await User.findOne({ sessionToken: token });
        if (user) {
            user.sessionToken = null;
            user.lastLoginAt = new Date();
            await user.save();
        }
        
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ success: false, error: 'Failed to logout' });
    }
});

// Add this after your existing routes (around line 800)

// FIXED Export data to Excel endpoint with proper error handling
app.get('/api/admin/export-excel', async (req, res) => {
    try {
        const { adminKey, collection } = req.query;
        
        // Admin authentication
        if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'admin123') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        let data;
        let filename;
        
        if (collection === 'users' || !collection) {
            // Export Users Data - SAFE VERSION
            const users = await User.find().select('-otp -otpExpiry -sessionToken');
            data = users.map(user => ({
                'Full Name': user.fullName || 'N/A',
                'Phone Number': `'${user.phoneNumber || 'N/A'}`,
                'Verified': user.isVerified ? 'Yes' : 'No',
                'Member Since': user.createdAt ? user.createdAt.toISOString().split('T')[0] : 'N/A',
                'Last Login': user.lastLoginAt ? user.lastLoginAt.toISOString().split('T')[0] : 'Never',
                'Total Predictions': 0
            }));
            filename = 'nimcet_users_data.csv';
        }
        
        if (collection === 'predictions' || !collection) {
            // Export Predictions Data - SAFE VERSION
            const predictions = await Prediction.find().populate('userId', 'fullName phoneNumber createdAt');
            data = predictions.map(pred => ({
                'Student Name': pred.userDetails?.fullName || 'N/A',
                'Phone Number': `'${pred.userDetails?.phoneNumber || 'N/A'}`,
                'Marks': pred.marks || 0,
                'Category': pred.category || 'N/A',
                'Predicted Min Rank': pred.predictedMinRank || 0,
                'Predicted Max Rank': pred.predictedMaxRank || 0,
                'Eligible Colleges': pred.eligibleColleges || 0,
                'Percentage': pred.additionalInfo?.percentage || 0,
                'Percentile': pred.additionalInfo?.percentile || 0,
                'Prediction Date': pred.createdAt ? pred.createdAt.toISOString().split('T')[0] : 'N/A',
                'Prediction Time': pred.createdAt ? pred.createdAt.toISOString().split('T')[1].split('.')[0] : 'N/A'
            }));
            filename = 'nimcet_predictions_data.csv';
        }
        
        // Convert to CSV format with proper escaping
        if (data && data.length > 0) {
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => headers.map(header => {
                    let value = row[header] || '';
                    if (header === 'Phone Number') {
                        value = `"'${value.replace(/'/g, '')}"`;
                    } else {
                        value = `"${value}"`;
                    }
                    return value;
                }).join(','))
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csvContent);
        } else {
            res.json({ success: false, message: 'No data found' });
        }
        
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ success: false, error: 'Failed to export data' });
    }
});

// FIXED Export combined data with proper null checks
app.get('/api/admin/export-all', async (req, res) => {
    try {
        const { adminKey } = req.query;
        
        if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'admin123') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const users = await User.find().select('-otp -otpExpiry -sessionToken');
        const predictions = await Prediction.find().populate('userId', 'fullName phoneNumber createdAt');
        
        // SAFE data mapping with null checks
        const combinedData = predictions.map(pred => ({
            'Student Name': pred.userDetails?.fullName || 'N/A',
            'Phone Number': `'${pred.userDetails?.phoneNumber || 'N/A'}`,
            'Marks': pred.marks || 0,
            'Category': pred.category || 'N/A',
            'Predicted Min Rank': pred.predictedMinRank || 0,
            'Predicted Max Rank': pred.predictedMaxRank || 0,
            'Rank Range': `${pred.predictedMinRank || 0} - ${pred.predictedMaxRank || 0}`,
            'Eligible Colleges': pred.eligibleColleges || 0,
            'Percentage': (pred.additionalInfo?.percentage || 0) + '%',
            'Percentile': (pred.additionalInfo?.percentile || 0) + '%',
            'Member Since': (pred.userId && pred.userId.createdAt) ? pred.userId.createdAt.toISOString().split('T')[0] : 'N/A',
            'Prediction Date': pred.createdAt ? pred.createdAt.toISOString().split('T')[0] : 'N/A',
            'Prediction Time': pred.createdAt ? pred.createdAt.toISOString().split('T')[1].split('.')[0] : 'N/A'
        }));
        
        // Check if we have data
        if (combinedData.length === 0) {
            return res.json({ success: false, message: 'No predictions found in database' });
        }
        
        // Safe CSV generation
        const headers = Object.keys(combinedData[0]);
        const csvContent = [
            headers.join(','),
            ...combinedData.map(row => headers.map(header => {
                let value = row[header] || '';
                if (header === 'Phone Number') {
                    value = `"'${value.replace(/'/g, '')}"`;
                } else {
                    value = `"${value}"`;
                }
                return value;
            }).join(','))
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="nimcet_complete_data.csv"');
        res.send(csvContent);
        
    } catch (error) {
        console.error('Export All Error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to export complete data',
            details: error.message 
        });
    }
});

// Admin endpoint to reset user prediction limit
app.post('/api/admin/reset-limit', async (req, res) => {
    try {
        const { adminKey, phoneNumber } = req.body;
        
        if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'admin123') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Delete all predictions for this user (reset limit)
        const deletedCount = await Prediction.deleteMany({ userId: user._id });
        
        res.json({
            success: true,
            message: `Prediction limit reset for ${phoneNumber}`,
            deletedPredictions: deletedCount.deletedCount,
            user: user.fullName
        });
        
    } catch (error) {
        console.error('Reset Limit Error:', error);
        res.status(500).json({ success: false, error: 'Failed to reset limit' });
    }
});

// Health check endpoint (Updated for MongoDB)
app.get('/health', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalPredictions = await Prediction.countDocuments();
        const verifiedUsers = await User.countDocuments({ isVerified: true });
        
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '3.0.0',
            database: 'MongoDB',
            examInfo: {
                name: 'NIMCET 2024',
                totalMarks: 1000,
                totalQuestions: 120
            },
            data: {
                colleges: nimcetColleges.length,
                rankRanges: nimcetRankData.length,
                totalUsers: totalUsers,
                totalPredictions: totalPredictions,
                verifiedUsers: verifiedUsers
            },
            features: [
                'Phone Verification with SMS',
                'Full Name Collection',
                'MongoDB Database Storage',
                'Rank Prediction (1000 marks)',
                'College Recommendations', 
                'Category-wise Analysis',
                'Admission Chances Calculator',
                'College Filtering System'
            ]
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            error: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'API endpoint not found',
        availableEndpoints: [
            'POST /api/send-otp',
            'POST /api/verify-otp', 
            'POST /api/predict-rank',
            'GET /api/colleges',
            'GET /api/user/predictions',
            'GET /api/user/prediction-limit',
            'GET /api/admin/predictions',
            'POST /api/admin/reset-limit',
            'POST /api/logout',
            'GET /health'
        ]
    });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ 
        success: false, 
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed.');
        process.exit(0);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 NIMCET Rank Predictor Server running on http://localhost:${PORT}`);
    console.log(`📱 Check console for OTP messages`);
    console.log(`🏫 ${nimcetColleges.length} colleges loaded`);
    console.log(`📊 ${nimcetRankData.length} rank prediction ranges loaded`);
    console.log(`🎯 Total Marks: 1000 | Total Questions: 120`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📈 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Documentation: http://localhost:${PORT}/api/*`);
    console.log(`\n✅ Server ready for NIMCET rank predictions!`);
});