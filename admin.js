document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Δεν υπάρχει token!");
    return (window.location.href = "login.html");
  }

  const adminContent = document.querySelector(".admin-content");
  const roomSelect = document.getElementById("room-select");
  const calendarEl = document.getElementById("calendar");

  // 📋 1. Φόρτωση και εμφάνιση όλων των κρατήσεων στον πίνακα
const res = await fetch("http://localhost:5000/bookings");
const data = await res.json();

const pendingTbody = document.querySelector("#pending-table tbody");
const approvedTbody = document.querySelector("#approved-table tbody");

document.getElementById("sort-select").addEventListener("change", (e) => {
  const value = e.target.value;
  if (value) {
    applySorting("pending-table", value);
    applySorting("approved-table", value);
  }
});

pendingTbody.innerHTML = "";
approvedTbody.innerHTML = "";

data.forEach((booking) => {
  const row = document.createElement("tr");
row.innerHTML = `
  <td style="padding: 12px 16px;">${booking.customer_name}</td>
  <td style="padding: 12px 16px;">${booking.email}</td>
  <td style="padding: 12px 16px;">${booking.room_id}</td>
  <td style="padding: 12px 16px;">${booking.check_in.split("T")[0]}</td>
  <td style="padding: 12px 16px;">${booking.check_out.split("T")[0]}</td>
  <td style="padding: 12px 16px;"></td>
`;

  const actionsCell = row.querySelector("td:last-child");

  if (booking.status === "pending") {
    const approveBtn = document.createElement("button");
    approveBtn.textContent = "✅ Έγκριση";
    approveBtn.onclick = () => updateStatus(booking.id, "approved");

    const rejectBtn = document.createElement("button");
    rejectBtn.textContent = "❌ Απόρριψη";
    rejectBtn.onclick = () => updateStatus(booking.id, "rejected");

    actionsCell.appendChild(approveBtn);
    actionsCell.appendChild(rejectBtn);
    pendingTbody.appendChild(row);
  } else if (booking.status === "approved") {
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️ Επεξεργασία";
    editBtn.onclick = () => editBooking(booking.id);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑 Διαγραφή";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.dataset.id = booking.id;

    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(deleteBtn);
    approvedTbody.appendChild(row);
  } else {
  // Όλα τα άλλα (π.χ. rejected) να μην προστεθούν πουθενά
  return;
}
});

  /* 📅 2. Ρύθμιση ημερολογίου
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    height: 500,
    events: [],
  eventTimeFormat: { // <<== αυτό το κομμάτι
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  displayEventTime: false // <<== Απενεργοποιεί πλήρως την ώρα
});
  calendar.render();*/

  // 📥 3. Φόρτωση δωματίων στο dropdown
  try {
    const rooms = await fetch("http://localhost:5000/rooms").then((res) =>
      res.json()
    );
    roomSelect.innerHTML = "";

    rooms.forEach((room) => {
      const option = document.createElement("option");
      option.value = room.id;
      option.textContent = room.name;
      roomSelect.appendChild(option);
    });

    // Αυτόματη φόρτωση για το πρώτο δωμάτιο
    if (rooms.length > 0) {
      roomSelect.value = rooms[0].id;
      roomSelect.dispatchEvent(new Event("change"));
    }
  } catch (err) {
    console.error("Σφάλμα κατά την φόρτωση των δωματίων:", err);
  }

  // 📆 4. Φόρτωση κρατήσεων ανά δωμάτιο στο ημερολόγιο
  roomSelect.addEventListener("change", async function () {
    const roomId = this.value;

    try {
      const bookings = await fetch(
        `http://localhost:5000/bookings/room/${roomId}`
      ).then((res) => res.json());

      // ➕ Μόνο approved
      const approvedBookings = bookings.filter(b => b.status === "approved");
      
      calendar.removeAllEvents();
      bookings.forEach((event) => {
        calendar.addEvent(event);
      });
    } catch (err) {
      console.error("Σφάλμα κατά την φόρτωση κρατήσεων δωματίου:", err);
    }
  });

  document.addEventListener("click", (e) => {
    console.log("📌 Κάποιο click έγινε:", e.target);
  });

  // 🗑️ 5. Διαγραφή κράτησης
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const bookingId = e.target.dataset.id;

      if (confirm("Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτή την κράτηση;")) {
        try {
          const res = await fetch(`http://localhost:5000/bookings/${bookingId}`, {
            method: "DELETE",
          });

          if (res.ok) {
            alert("Η κράτηση διαγράφηκε!");
            location.reload();
          } else {
            alert("Αποτυχία διαγραφής.");
          }
        } catch (err) {
          console.error("Σφάλμα διαγραφής:", err);
        }
      }
    }
  });

  // ✏️ 6. Επεξεργασία κράτησης (modal)
  function editBooking(bookingId) {
    fetch(`http://localhost:5000/bookings/${bookingId}`)
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("edit-id").value = data.id;
        document.getElementById("edit-name").value = data.customer_name;
        document.getElementById("edit-email").value = data.email;
        document.getElementById("edit-checkin").value = data.check_in.split("T")[0];
        document.getElementById("edit-checkout").value = data.check_out.split("T")[0];

        document.getElementById("edit-modal").style.display = "block";
      })
      .catch((err) => {
        console.error("Σφάλμα κατά την φόρτωση της κράτησης:", err);
      });
  }

  // 📤 7. Υποβολή φόρμας επεξεργασίας
  let editFormInitialized = false;
const editForm = document.getElementById("edit-form");
if (editForm && !editFormInitialized) {
  editForm.addEventListener("submit", handleEditSubmit);
  editFormInitialized = true;
}

async function handleEditSubmit(e) {
  e.preventDefault();

  const bookingId = document.getElementById("edit-id").value;
  const updatedData = {
    customer_name: document.getElementById("edit-name").value,
    email: document.getElementById("edit-email").value,
    check_in: document.getElementById("edit-checkin").value,
    check_out: document.getElementById("edit-checkout").value,
  };

  try {
    const res = await fetch(`http://localhost:5000/bookings/${bookingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });

    if (res.ok) {
      alert("Η κράτηση ενημερώθηκε!");
      location.reload();
    } else {
      alert("Αποτυχία ενημέρωσης.");
    }
  } catch (err) {
    console.error("Σφάλμα ενημέρωσης:", err);
  }

  document.getElementById("edit-modal").style.display = "none";

  }
  document.getElementById("export-btn").addEventListener("click", () => {
  const exportData = [];
  const tables = ["pending-table", "approved-table"];

  tables.forEach(tableId => {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      exportData.push({
        Όνομα: cells[0].textContent.trim(),
        Email: cells[1].textContent.trim(),
        Δωμάτιο: cells[2].textContent.trim(),
        Άφιξη: cells[3].textContent.trim(),
        Αναχώρηση: cells[4].textContent.trim(),
        Κατάσταση: tableId === "pending-table" ? "Εκκρεμεί" : "Εγκεκριμένη"
      });
    });
  });

  // Δημιουργία φύλλου και βιβλίου Excel
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Κρατήσεις");

  // Λήψη αρχείου
  XLSX.writeFile(workbook, "krathseis.xlsx");
});
});
async function updateStatus(bookingId, status) {
  try {
    const res = await fetch(`http://localhost:5000/bookings/${bookingId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      alert("Η κατάσταση της κράτησης ενημερώθηκε.");
      location.reload();
    } else {
      alert("Αποτυχία ενημέρωσης κατάστασης.");
    }
  } catch (err) {
    console.error("Σφάλμα κατά την ενημέρωση κατάστασης:", err);
  }
}
function applySorting(tableId, sortValue) {
  const table = document.getElementById(tableId);
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  const [key, dir] = sortValue.split("-");
  const direction = dir === "asc" ? 1 : -1;

  const columnIndexMap = {
    name: 0,
    email: 1,
    room: 2,
    checkin: 3,
    checkout: 4,
  };

  const index = columnIndexMap[key];

  rows.sort((a, b) => {
    let aVal = a.children[index].textContent.trim().toLowerCase();
    let bVal = b.children[index].textContent.trim().toLowerCase();

    // Αν είναι αριθμός δωματίου
    if (key === "room") {
      return (parseInt(aVal) - parseInt(bVal)) * direction;
    }

    // Αν είναι ημερομηνία
    if (key === "checkin" || key === "checkout") {
      return (new Date(aVal) - new Date(bVal)) * direction;
    }

    // Αν είναι όνομα ή email
    return aVal.localeCompare(bVal) * direction;
  });

  rows.forEach(row => tbody.appendChild(row));
}