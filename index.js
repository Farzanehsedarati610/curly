const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const OPENBANKING_URL = process.env.OPENBANKING_OAUTH_URL || "https://apisandbox.openbankproject.com";
const CONSUMER_KEY = process.env.OPENBANKING_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.OPENBANKING_CONSUMER_SECRET;

// 🔹 Authentication Route (No Token Needed)
app.post("/auth", async (req, res) => {
    try {
        const response = await axios.post(`${OPENBANKING_URL}/oauth/initiate`, {
            consumer_key: CONSUMER_KEY,
            consumer_secret: CONSUMER_SECRET
        });
        res.json({ success: true, api_key: CONSUMER_KEY, api_secret: CONSUMER_SECRET });
    } catch (error) {
        console.error("Authentication Error:", error.message);
        res.status(500).json({ error: "Authentication failed", details: error.response?.data || error.message });
    }
});

// 🔹 Retrieve Accounts (No Token, Uses API Key & Secret)
app.get("/accounts", async (req, res) => {
    try {
        const response = await axios.get(`${OPENBANKING_URL}/accounts`, {
            headers: {
                "Consumer-Key": CONSUMER_KEY,
                "Consumer-Secret": CONSUMER_SECRET
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Accounts Retrieval Error:", error.message);
        res.status(500).json({ error: "Failed to retrieve accounts", details: error.response?.data || error.message });
    }
});

// 🔹 Money Transfer (No Token, Uses API Key & Secret)
app.post("/transfer", async (req, res) => {
    try {
        const { routing_account, destination_account, amount } = req.body;
        if (!routing_account || !destination_account || !amount) {
            return res.status(400).json({ error: "Missing required transaction data" });
        }

        const response = await axios.post(`${OPENBANKING_URL}/transfer`, {
            routing_account,
            destination_account,
            amount
        }, {
            headers: {
                "Consumer-Key": CONSUMER_KEY,
                "Consumer-Secret": CONSUMER_SECRET
            }
        });

        res.json({ success: true, transaction_id: response.data.transaction_id });
    } catch (error) {
        console.error("Money Transfer Error:", error.message);
        res.status(500).json({ error: "Transfer failed", details: error.response?.data || error.message });
    }
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

