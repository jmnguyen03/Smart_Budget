require('dotenv').config(); // Allows the server to read your .env file
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors'); // Allows your React app to send requests here

const app = express();

// Enable CORS for your React frontend (assuming it runs on localhost:3000)
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json()); // Allows server to read JSON bodies

// 1. General API Rate Limiter (Standard Protection)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: 'Too many requests, please try again later.' }
});

// 2. Strict AI Route Rate Limiter (Cost Management)
const aiEndpointLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // Limit each IP to 5 AI generations per hour
    message: { error: 'You have reached your Smart Advisor generation limit for this hour.' },
    standardHeaders: true, 
    legacyHeaders: false, 
});

// Apply standard limiter to all routes
app.use('/api/', generalLimiter);

// Apply the strict limiter specifically to the AI coaching endpoint
app.post('/api/advisor/generate', aiEndpointLimiter, async (req, res) => {
    try {
        // Access the securely provisioned API key
        const apiKey = process.env.AI_PROVIDER_API_KEY;
        
        // Transform, Load, and Fetch LLM response here...
        
        res.status(200).json({ success: true, message: "Insight generated." });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate insight." });
    }
});

const PORT = process.env.PORT || 5000; // Using 5000 so it doesn't conflict with React on 3000
app.listen(PORT, () => console.log(`Smart Advisor Backend running on port ${PORT}`));