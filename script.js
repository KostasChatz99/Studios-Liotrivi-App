let galleryImages = [];
let currentIndex = 0;

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room_id");
    
    const form = document.getElementById("search-form");
    const roomsContainer = document.getElementById("rooms-container");

  const searchBtn = document.getElementById("search-btn");
    
  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      const checkIn = document.getElementById("check-in").value;
      const checkOut = document.getElementById("check-out").value;
     // const guests = document.getElementById("guests").value;
      const guests = parseInt(document.getElementById("guests").value, 10);

      if (!checkIn || !checkOut || !guests) {
        alert("Συμπλήρωσε όλα τα πεδία!");
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/bookings/available-rooms?check_in=${checkIn}&check_out=${checkOut}&people=${guests}`);
        const availableRooms = await res.json();
        console.log("📦 Απάντηση από backend:", availableRooms);

        const container = document.getElementById("rooms-container");
        container.innerHTML = "";

        if (!Array.isArray(availableRooms) || availableRooms.length === 0) {
        container.innerHTML = "<p>❌ Δεν υπάρχουν διαθέσιμα δωμάτια.</p>";
        return;
        }

        availableRooms.forEach(room => {
          const roomDiv = document.createElement("div");
          roomDiv.classList.add("room");
          roomDiv.innerHTML = `
            <a href="room-details.html?room_id=${room.id}">
              <img src="images/${room.image}" alt="${room.name}">
            </a>
            <div class="room-details">
              <h3>${room.name}</h3>
              <p>Χωρητικότητα: ${room.capacity} άτομα</p>
              <p>Τιμή: ${room.price}€</p>
              <a href="booking.html?room_id=${room.id}">Κάντε Κράτηση</a>
            </div>
          `;
          container.appendChild(roomDiv);
        });
      } catch (err) {
        console.error("Σφάλμα κατά την αναζήτηση:", err);
        alert("Παρουσιάστηκε σφάλμα κατά την αναζήτηση.");
      }
    });
  }
});

    const bookingButton = document.getElementById("booking-button");
    if (bookingButton) {
        bookingButton.addEventListener("click", function () {
            window.location.href = "booking.html";
        });
    }

    // 🔹 Dropdown για φόρμα κράτησης
    if (document.getElementById("room_id")) {
        fetch("http://localhost:5000/rooms")
            .then(response => response.json())
            .then(data => {
                const roomSelect = document.getElementById("room_id");
                roomSelect.innerHTML = "";

                data.forEach(room => {
                    const option = document.createElement("option");
                    option.value = room.id;
                    option.textContent = `${room.name} - ${room.price}€`;
                    if (room.id == roomId) option.selected = true;
                    roomSelect.appendChild(option);
                });
            })
            .catch(error => console.error("Error fetching rooms:", error));
    }

    /* 🔹 Υποβολή φόρμας κράτησης
    if (document.getElementById("booking-form")) {
        document.getElementById("booking-form").addEventListener("submit", function (e) {
            e.preventDefault();

            const bookingData = {
                room_id: document.getElementById("room_id").value,
                customer_name: document.getElementById("name").value,
                email: document.getElementById("email").value,
                check_in: document.getElementById("checkin_date").value,
                check_out: document.getElementById("checkout_date").value,
            };

            fetch("http://localhost:5000/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookingData)
            })
                .then(response => response.json())
                .then(data => {
                    alert("Η κράτηση ολοκληρώθηκε επιτυχώς!");
                    window.location.href = "index.html";
                })
                .catch(error => console.error("Σφάλμα στην κράτηση:", error));
        });
    }*/

    // 🔹 Φόρτωση όλων των δωματίων
    if (document.getElementById("rooms-container")) {
        fetchRooms();
    }

    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room_id");
    // 🔹 Φόρτωση εικόνων δωματίου για booking.html
    if (roomId && document.getElementById("room-gallery")) {
        fetch(`http://localhost:5000/rooms/${roomId}/images`)
            .then(res => res.json())
            .then(images => {
                galleryImages = images;
                const gallery = document.getElementById("room-gallery");
                gallery.innerHTML = "";

                images.forEach((img, index) => {
                    const imgEl = document.createElement("img");
                    imgEl.src = img.image_url;
                    imgEl.alt = "Εικόνα Δωματίου";
                    imgEl.classList.add("gallery-image");
                    imgEl.addEventListener("click", () => openLightbox(index));
                    gallery.appendChild(imgEl);
                });
            })
            .catch(err => console.error("Σφάλμα φόρτωσης εικόνας δωματίου:", err));
    }

    // 🔹 Lightbox λειτουργίες
    if (document.getElementById("lightbox-close")) {
        document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
        document.getElementById("next-btn").addEventListener("click", showNextImage);
        document.getElementById("prev-btn").addEventListener("click", showPreviousImage);
    }


// ✅ Συνάρτηση για την εμφάνιση δωματίων <p>${room.description}</p>
function fetchRooms() {
    fetch("http://localhost:5000/rooms")
        .then(response => response.json())
        .then(data => {
            const roomsContainer = document.getElementById("rooms-container");
            roomsContainer.innerHTML = "";

            data.forEach(room => {
                const roomDiv = document.createElement("div");
                roomDiv.classList.add("room");
                roomDiv.innerHTML = `
                <a href="room-details.html?room_id=${room.id}">
                  <img src="images/${room.image}" alt="${room.name}">
                </a>
                <div class="room-details">
                  <h3>${room.name}</h3>
                  
                  <p>Τιμή ανά διανυκτέρευση: ${room.price}€</p>
                  <a href="booking.html?room_id=${room.id}">Κάντε Κράτηση</a>
                </div>
              `;
                roomsContainer.appendChild(roomDiv);
            });
        })
        .catch(error => console.error("Σφάλμα κατά τη φόρτωση των δωματίων:", error));
}

// ✅ Lightbox functions
function openLightbox(index) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");

    currentIndex = index;
    lightboxImg.src = galleryImages[currentIndex].image_url;
    lightbox.style.display = "flex";
}

function closeLightbox() {
    document.getElementById("lightbox").style.display = "none";
}

function showNextImage() {
    currentIndex = (currentIndex + 1) % galleryImages.length;
    document.getElementById("lightbox-img").src = galleryImages[currentIndex].image_url;
}

function showPreviousImage() {
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    document.getElementById("lightbox-img").src = galleryImages[currentIndex].image_url;
}
