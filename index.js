const express = require("express");
const app = express();
app.use(express.json());  // ✅ Enables JSON parsing

app.post("/auth", (req, res) => {
    res.json({ success: true, message: "Authentication received." });
});
app.get("/accounts", (req, res) => {
    res.json({ success: true, message: "Accounts retrieved successfully." });
});
const PORT = process.env.PORT || 80;  // ✅ Ensure the correct port
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));



