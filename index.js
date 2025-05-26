const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());

const OPENBANKING_URL = process.env.OPENBANKING_OAUTH_URL || "https://apisandbox.openbankproject.com";
const JWS_PRIVATE_KEY = JSON.parse(process.env.OAUTH2_JWK_PRIVATE_KEY);
const JWS_ALG = process.env.OAUTH2_JWS_ALG || "ES512";
const REDIRECT_URI = process.env.REDIRECT_URI || "https://curl-6yum.onrender.com/callback";

// 🔹 Generate a JWS Token for OAuth2 Authentication
function generateJWS() {
    const payload = {
        iss: JWS_PRIVATE_KEY.kid,  // Key ID
        aud: OPENBANKING_URL,
        exp: Math.floor(Date.now() / 1000) + 300, // Expires in 5 minutes
        iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, JWS_PRIVATE_KEY, { algorithm: JWS_ALG });
}

// 🔹 Root Route for API Status
app.get("/", (req, res) => {
    res.json({ success: true, message: "API is running with JWS authentication!" });
});

// 🔹 Authentication Route (OAuth2 with JWS-ES512)
app.post("/auth", async (req, res) => {
    try {
        const jwsToken = generateJWS();

        const response = await axios.post(`${OPENBANKING_URL}/oauth2/authenticate`, {
            grant_type: "client_credentials",
            assertion: jwsToken
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

