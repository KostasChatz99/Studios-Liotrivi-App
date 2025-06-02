// routes/bookings.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET /bookings
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        room_id,
        customer_name,
        email,
        TO_CHAR(check_in, 'YYYY-MM-DD')   AS check_in,
        TO_CHAR(check_out, 'YYYY-MM-DD')  AS check_out,
        status
      FROM bookings
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Σφάλμα:", err.message);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});


// POST /bookings
// POST /bookings
router.post("/", async (req, res) => {
  const { room_id, customer_name, email, check_in, check_out } = req.body;

  if (!room_id || !customer_name || !email || !check_in || !check_out) {
    return res.status(400).json({ error: "Όλα τα πεδία είναι υποχρεωτικά!" });
  }

  const cleanCheckIn = new Date(check_in).toISOString().slice(0, 10);
  const cleanCheckOut = new Date(check_out).toISOString().slice(0, 10);

  try {
    const conflict = await pool.query(
      `SELECT * FROM bookings 
       WHERE room_id = $1 
	   AND status <> 'rejected'
       AND check_in < $3 
       AND check_out > $2`,
      [room_id, cleanCheckIn, cleanCheckOut]
    );

    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: "Το δωμάτιο δεν είναι διαθέσιμο για τις επιλεγμένες ημερομηνίες." });
    }

    const newBooking = await pool.query(
      `INSERT INTO bookings (room_id, customer_name, email, check_in, check_out) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [room_id, customer_name, email, cleanCheckIn, cleanCheckOut]
    );

    res.status(201).json(newBooking.rows[0]);
  } catch (err) {
    console.error("Σφάλμα:", err.message);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});

// DELETE κράτησης
router.delete("/:id", async (req, res) => {
  const bookingId = req.params.id;

  try {
    const result = await pool.query("DELETE FROM bookings WHERE id = $1 RETURNING *", [bookingId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Η κράτηση δεν βρέθηκε." });
    }

    res.json({ message: "Η κράτηση διαγράφηκε." });
  } catch (err) {
    console.error("Σφάλμα διαγραφής κράτησης:", err.message);
    res.status(500).json({ message: "Σφάλμα στον server" });
  }
});


// PUT κράτηση
router.put("/:id", async (req, res) => {
  const bookingId = parseInt(req.params.id);
  const { customer_name, email, check_in, check_out } = req.body;

  try {
    const result = await pool.query(
      "UPDATE bookings SET customer_name = $1, email = $2, check_in = $3, check_out = $4 WHERE id = $5 RETURNING *",
      [customer_name, email, check_in, check_out, bookingId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Σφάλμα κατά την ενημέρωση κράτησης:", err.message);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});

// GET κρατήσεις ανά δωμάτιο
router.get("/room/:id", async (req, res) => {
  const roomId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT 
         customer_name AS title, 
         TO_CHAR(check_in, 'YYYY-MM-DD') AS start, 
         TO_CHAR(check_out, 'YYYY-MM-DD') AS end 
       FROM bookings 
       WHERE room_id = $1 AND status = 'approved'`,
      [roomId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Σφάλμα φόρτωσης κρατήσεων ανά δωμάτιο:", err.message);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});
// PUT /bookings/:id/status
router.put("/:id/status", async (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body; // πρέπει να είναι 'approved' ή 'rejected'

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Μη έγκυρη κατάσταση κράτησης." });
  }

  try {
    const result = await pool.query(
      "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
      [status, bookingId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Η κράτηση δεν βρέθηκε." });
    }

    res.json({ message: `Η κράτηση ενημερώθηκε σε: ${status}`, booking: result.rows[0] });
  } catch (err) {
    console.error("Σφάλμα ενημέρωσης status κράτησης:", err.message);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});
// Μόνο εγκεκριμένες κρατήσεις
router.get("/approved", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM bookings WHERE status = 'approved'"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Σφάλμα:", err.message);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});

router.get("/available-rooms", async (req, res) => {
  console.log("🔍 RAW QUERY PARAMS:", req.query);
  const { check_in, check_out, people } = req.query;
  const numberOfPeople = parseInt(people, 10);

  console.log("➡️ check_in:", check_in);
  console.log("➡️ check_out:", check_out);
  console.log("➡️ numberOfPeople:", numberOfPeople);

  if (!check_in || !check_out || isNaN(numberOfPeople)) {
    return res.status(400).json({ error: "Λείπουν ή είναι άκυρες οι παράμετροι." });
  }

  try {
    const query = `
      SELECT *
      FROM rooms
      WHERE capacity >= $1
        AND id NOT IN (
          SELECT room_id
          FROM bookings
          WHERE status <> 'rejected'
            AND check_in < $3
            AND check_out > $2
        )
    `;

    const values = [numberOfPeople, check_in, check_out];

    console.log("📄 Εκτελώ SQL με:", values);

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Σφάλμα κατά την αναζήτηση δωματίων:", err.message);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});



/* GET κρατήσεις μόνο εγκεκριμένες ανά δωμάτιο
router.get("/room/:id", async (req, res) => {
  const roomId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT customer_name AS title, check_in AS start, check_out AS end
       FROM bookings
       WHERE room_id = $1 AND status = 'approved'`,
      [roomId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Σφάλμα φόρτωσης κρατήσεων ανά δωμάτιο:", err.message);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});*/
router.get("/room/:id", async (req, res) => {
  const roomId = parseInt(req.params.id);

  if (isNaN(roomId)) {
    return res.status(400).json({ error: "Μη έγκυρο ID δωματίου" });
  }

  try {
    const result = await pool.query(
      `SELECT customer_name AS title, check_in AS start, check_out AS end
       FROM bookings
       WHERE room_id = $1 AND status = 'approved'`,
      [roomId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Σφάλμα SQL:", err.message);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});
// GET κράτηση με id
router.get("/:id", async (req, res) => {
  const bookingId = parseInt(req.params.id);
  try {
    const result = await pool.query("SELECT * FROM bookings WHERE id = $1", [bookingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Σφάλμα στην αναζήτηση κράτησης:", err.message);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});

module.exports = router;
