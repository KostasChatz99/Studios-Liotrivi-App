require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Εισαγωγή routes για κρατήσεις από ξεχωριστό αρχείο
const bookingRoutes = require("./routes/bookings");
app.use("/bookings", bookingRoutes);  // routes για GET, POST, DELETE κρατήσεων

// 🔹 Routes
app.get("/rooms", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM rooms");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get("/rooms/:id/images", async (req, res) => {
  const roomId = req.params.id;
  try {
    const result = await pool.query(
      "SELECT image_url FROM room_images WHERE room_id = $1",
      [roomId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 🔐 Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(401).json({ message: "User not found" });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🔐 Register
app.post("/register", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",
      [email, hashed, role]
    );
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error creating user" });
  }
});

// 🔹 Εκκίνηση server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
const nodemailer = require("nodemailer");

app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Όλα τα πεδία είναι υποχρεωτικά." });
  }

  try {
    // Δημιουργία transporter (για Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "kostaschatzispyrou@gmail.com",
        pass: "qrph sjva ogyh gkze"
      }
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: "kostaschatzispyrou@gmail",
      subject: "📩 Νέο Μήνυμα από την Ιστοσελίδα",
      text: message,
      html: `<p><strong>Αποστολέας:</strong> ${name} (${email})</p><p>${message}</p>`
    });

    res.json({ success: true, message: "Το μήνυμα εστάλη επιτυχώς!" });
  } catch (err) {
    console.error("Σφάλμα αποστολής email:", err.message);
    res.status(500).json({ error: "Σφάλμα κατά την αποστολή email." });
  }
});
