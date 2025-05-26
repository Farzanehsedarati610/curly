const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(express.json());

const OPENBANKING_URL = process.env.OPENBANKING_OAUTH_URL || "https://apisandbox.openbankproject.com";
const CONSUMER_KEY = process.env.OPENBANKING_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.OPENBANKING_CONSUMER_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "https://curl-6yum.onrender.com/callback";

function generateSignature(method, url, timestamp, nonce) {
    const baseString = `${method}&${encodeURIComponent(url)}&oauth_consumer_key=${CONSUMER_KEY}&oauth_nonce=${nonce}&oauth_signature_method=HMAC-SHA256&oauth_timestamp=${timestamp}&oauth_callback=${encodeURIComponent(REDIRECT_URI)}`;
    return crypto.createHmac("sha256", CONSUMER_SECRET).update(baseString).digest("base64");
}

// 🔹 Root Route for API Status
app.get("/", (req, res) => {
    res.json({ success: true, message: "API is running!" });
});

// 🔹 Authentication Route (OAuth 1.0a)
app.post("/auth", async (req, res) => {
    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = crypto.randomBytes(16).toString("hex");
        const signature = generateSignature("POST", `${OPENBANKING_URL}/oauth/initiate`, timestamp, nonce);

        const response = await axios.post(`${OPENBANKING_URL}/oauth/initiate`, {
            oauth_signature_method: "HMAC-SHA256",
            oauth_signature: signature,
            oauth_consumer_key: CONSUMER_KEY,
            oauth_callback: REDIRECT_URI,
            oauth_timestamp: timestamp,
            oauth_nonce: nonce
        });

        res.json({ success: true, access_token: response.data.access_token });
    } catch (error) {
        console.error("Authentication Error:", error.message);
        res.status(500).json({ error: "Authentication failed", details: error.response?.data || error.message });
    }
});

// 🔹 Retrieve Accounts (Authenticated)
app.get("/accounts", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Missing access token" });

        const response = await axios.get(`${OPENBANKING_URL}/accounts`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Accounts Retrieval Error:", error.message);
        res.status(500).json({ error: "Failed to retrieve accounts", details: error.response?.data || error.message });
    }
});

// 🔹 Money Transfer (Authenticated)
app.post("/transfer", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Missing access token" });

        const { routing_account, destination_account, amount } = req.body;
        if (!routing_account || !destination_account || !amount) {
            return res.status(400).json({ error: "Missing required transaction data" });
        }

        const response = await axios.post(`${OPENBANKING_URL}/transfer`, {
            routing_account,
            destination_account,
            amount
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        res.json({ success: true, transaction_id: response.data.transaction_id });
    } catch (error) {
        console.error("Money Transfer Error:", error.message);
        res.status(500).json({ error: "Transfer failed", details: error.response?.data || error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

