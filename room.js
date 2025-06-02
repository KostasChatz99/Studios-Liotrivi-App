// Ενημέρωση δωματίου
app.put('/rooms/:id', async (req, res) => {
  const { name, type, price, image, description } = req.body;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE rooms SET name = $1, type = $2, price = $3, image = $4, description = $5 WHERE id = $6 RETURNING *`,
      [name, type, price, image, description, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating room:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Διαγραφή δωματίου
app.delete('/rooms/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM rooms WHERE id = $1", [id]);
    res.json({ message: "Room deleted" });
  } catch (err) {
    console.error("Error deleting room:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});
