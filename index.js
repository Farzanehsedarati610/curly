const express = require("express");
const app = express();
app.use(express.json());  // ✅ Enables JSON parsing

app.post("/transfer", (req, res) => {
    res.json({ success: true, message: "Transaction received." });
});

const PORT = process.env.PORT || 80;  // ✅ Ensure the correct port
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

