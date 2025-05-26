const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());  // ✅ Enables JSON parsing

const OPENBANKING_URL = process.env.OPENBANKING_OAUTH_URL;
const CONSUMER_KEY = process.env.OPENBANKING_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.OPENBANKING_CONSUMER_SECRET;

// 🔹 Authentication Route
app.post("/auth", async (req, res) => {
    try {
        const response = await axios.post(`${OPENBANKING_URL}/oauth/initiate`, {
            consumer_key: CONSUMER_KEY,
            consumer_secret: CONSUMER_SECRET
        });
        res.json({ success: true, access_token: response.data.access_token });
    } catch (error) {
        res.status(500).json({ error: "Authentication failed", details: error.response?.data || error.message });
    }
});

// 🔹 Retrieve Accounts Route
app.get("/accounts", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Removes 'Bearer ' prefix
        if (!token) return res.status(401).json({ error: "Missing access token" });

        const response = await axios.get(`${OPENBANKING_URL}/accounts`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve accounts", details: error.response?.data || error.message });
    }
});

// 🔹 Money Transfer Route
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
        res.status(500).json({ error: "Transfer failed", details: error.response?.data || error.message });
    }
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

