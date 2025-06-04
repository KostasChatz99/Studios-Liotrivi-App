document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Δεν υπάρχει token!");
    return (window.location.href = "login.html");
  }

  const roomSelect = document.getElementById("room-select");
  const calendarEl = document.getElementById("calendar");

  // Ρύθμιση FullCalendar
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    height: 500,
    events: [],
    eventTimeFormat: {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    },
    displayEventTime: false
  });
  calendar.render();

  // Φόρτωση δωματίων
  try {
    const rooms = await fetch("http://localhost:5000/rooms").then(res => res.json());
    rooms.forEach(room => {
      const option = document.createElement("option");
      option.value = room.id;
      option.textContent = room.name;
      roomSelect.appendChild(option);
    });

    // Αυτόματη φόρτωση πρώτου δωματίου
    if (rooms.length > 0) {
      roomSelect.value = rooms[0].id;
      roomSelect.dispatchEvent(new Event("change"));
    }
  } catch (err) {
    console.error("Σφάλμα κατά την φόρτωση των δωματίων:", err);
  }

  // Φόρτωση κρατήσεων με βάση το δωμάτιο
  roomSelect.addEventListener("change", async function () {
    const roomId = this.value;

    try {
      const bookings = await fetch(`http://localhost:5000/bookings/room/${roomId}`).then(res => res.json());
      const approved = bookings.filter(b => b.status === "approved");

      calendar.removeAllEvents();
      approved.forEach(event => {
        calendar.addEvent({
          ...event,
          start: event.start.split("T")[0],
          end: event.end.split("T")[0]
        });
      });
    } catch (err) {
      console.error("Σφάλμα κατά την φόρτωση κρατήσεων:", err);
    }
  });
});
