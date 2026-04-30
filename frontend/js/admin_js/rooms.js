const body = document.body;
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");

const hostelFilter = document.getElementById("hostelFilter");
const hostelSelect = document.getElementById("hostelSelect");
const roomsGrid = document.getElementById("roomsGrid");

const filteredRoomsEl = document.getElementById("filteredRooms");
const totalBedsEl = document.getElementById("totalBeds");
const occupiedBedsEl = document.getElementById("occupiedBeds");
const availableBedsEl = document.getElementById("availableBeds");

const openRoomModalButton = document.getElementById("openRoomModal");
const roomModal = document.getElementById("roomModal");
const detailsModal = document.getElementById("detailsModal");
const confirmModal = document.getElementById("confirmModal");
const roomForm = document.getElementById("roomForm");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");

const roomNumberInput = document.getElementById("roomNumber");
const roomCapacityInput = document.getElementById("roomCapacity");
const occupiedCountInput = document.getElementById("occupiedCount");
const roomStatusInput = document.getElementById("roomStatus");

const detailsTitle = document.getElementById("detailsTitle");
const detailsContent = document.getElementById("detailsContent");
const confirmText = document.getElementById("confirmText");
const confirmDeleteButton = document.getElementById("confirmDelete");

const hostels = [
    { id: "hostelA", name: "Hostel A" },
    { id: "hostelB", name: "Hostel B" },
    { id: "hostelC", name: "Hostel C" }
];

let rooms = [
    { id: 1, hostelId: "hostelA", roomNumber: "A-101", capacity: 3, occupiedBeds: 2, status: "Available" },
    { id: 2, hostelId: "hostelA", roomNumber: "A-203", capacity: 4, occupiedBeds: 4, status: "Full" },
    { id: 3, hostelId: "hostelA", roomNumber: "A-305", capacity: 2, occupiedBeds: 0, status: "Maintenance" },
    { id: 4, hostelId: "hostelB", roomNumber: "B-110", capacity: 3, occupiedBeds: 1, status: "Available" },
    { id: 5, hostelId: "hostelB", roomNumber: "B-212", capacity: 4, occupiedBeds: 4, status: "Full" },
    { id: 6, hostelId: "hostelC", roomNumber: "C-011", capacity: 2, occupiedBeds: 1, status: "Available" },
    { id: 7, hostelId: "hostelC", roomNumber: "C-120", capacity: 3, occupiedBeds: 0, status: "Maintenance" }
];

let selectedHostelId = hostels[0].id;
let editId = null;
let deleteId = null;

function openMobileSidebar() {
    body.classList.add("sidebar-open");
    mobileOverlay.classList.add("active");
}

function closeMobileSidebar() {
    body.classList.remove("sidebar-open");
    mobileOverlay.classList.remove("active");
}

function toggleSidebar() {
    if (body.classList.contains("sidebar-open")) {
        closeMobileSidebar();
    } else {
        openMobileSidebar();
    }
}

function handleResize() {
    closeMobileSidebar();
}

function populateHostelOptions() {
    const options = hostels.map((hostel) => `<option value="${hostel.id}">${hostel.name}</option>`).join("");
    hostelFilter.innerHTML = options;
    hostelSelect.innerHTML = options;
    hostelFilter.value = selectedHostelId;
    hostelSelect.value = selectedHostelId;
}

function findHostelName(hostelId) {
    return hostels.find((hostel) => hostel.id === hostelId)?.name || "Unknown Hostel";
}

function getAvailableBeds(room) {
    return room.capacity - room.occupiedBeds;
}

function deriveStatus(capacity, occupiedBeds, currentStatus) {
    if (currentStatus === "Maintenance") {
        return "Maintenance";
    }

    if (occupiedBeds >= capacity) {
        return "Full";
    }

    return "Available";
}

function getFilteredRooms() {
    return rooms.filter((room) => room.hostelId === selectedHostelId);
}

function animateCounter(element, target) {
    const start = Number(element.textContent.replace(/,/g, "")) || 0;
    const startTime = performance.now();
    const duration = 700;

    function update(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(start + (target - start) * eased);
        element.textContent = value.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function updateSummary(filteredRooms) {
    const totals = filteredRooms.reduce((acc, room) => {
        acc.capacity += room.capacity;
        acc.occupied += room.occupiedBeds;
        return acc;
    }, { capacity: 0, occupied: 0 });

    animateCounter(filteredRoomsEl, filteredRooms.length);
    animateCounter(totalBedsEl, totals.capacity);
    animateCounter(occupiedBedsEl, totals.occupied);
    animateCounter(availableBedsEl, totals.capacity - totals.occupied);
}

function renderRooms() {
    const filteredRooms = getFilteredRooms();
    roomsGrid.innerHTML = "";

    filteredRooms.forEach((room) => {
        const statusClass = room.status.toLowerCase();
        const card = document.createElement("article");
        card.className = "room-card";
        card.innerHTML = `
            <div class="mb-5 flex items-start justify-between gap-4">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/75">${findHostelName(room.hostelId)}</p>
                    <h3 class="mt-2 text-2xl font-bold text-white">${room.roomNumber}</h3>
                </div>
                <span class="room-chip">${room.occupiedBeds}/${room.capacity}</span>
            </div>

            <div class="space-y-3 text-sm text-slate-300">
                <div class="flex items-center justify-between gap-4">
                    <span>Capacity</span>
                    <span class="font-semibold text-white">${room.capacity} beds</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                    <span>Occupied Beds</span>
                    <span class="font-semibold text-white">${room.occupiedBeds}/${room.capacity}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                    <span>Available Beds</span>
                    <span class="font-semibold text-white">${getAvailableBeds(room)}</span>
                </div>
                <div class="pt-2">
                    <span class="status-badge status-${statusClass}">${room.status}</span>
                </div>
            </div>

            <div class="mt-6 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <button class="card-action" data-action="edit" data-id="${room.id}" title="Edit room" aria-label="Edit room">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                    </button>
                    <button class="card-action" data-action="delete" data-id="${room.id}" title="Delete room" aria-label="Delete room">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path></svg>
                    </button>
                </div>
                <button class="details-btn rounded-2xl px-4 py-2.5 text-sm font-semibold text-white" data-action="view" data-id="${room.id}">
                    View Details
                </button>
            </div>
        `;

        roomsGrid.appendChild(card);
    });

    updateSummary(filteredRooms);
}

function resetForm() {
    roomForm.reset();
    formError.textContent = "";
    editId = null;
    hostelSelect.value = selectedHostelId;
    roomStatusInput.value = "Available";
}

function openFormModal(mode, room = null) {
    resetForm();
    modalTitle.textContent = mode === "edit" ? "Edit Room" : "Add Room";

    if (mode === "edit" && room) {
        hostelSelect.value = room.hostelId;
        roomNumberInput.value = room.roomNumber;
        roomCapacityInput.value = room.capacity;
        occupiedCountInput.value = room.occupiedBeds;
        roomStatusInput.value = room.status;
        editId = room.id;
    }

    roomModal.classList.remove("hidden");
}

function closeFormModal() {
    roomModal.classList.add("hidden");
    resetForm();
}

function openDetailsModal(room) {
    detailsTitle.textContent = room.roomNumber;
    detailsContent.innerHTML = `
        <div class="detail-item"><p class="detail-label">Room Number</p><p class="detail-value">${room.roomNumber}</p></div>
        <div class="detail-item"><p class="detail-label">Hostel Name</p><p class="detail-value">${findHostelName(room.hostelId)}</p></div>
        <div class="detail-item"><p class="detail-label">Capacity</p><p class="detail-value">${room.capacity} beds</p></div>
        <div class="detail-item"><p class="detail-label">Occupied Beds</p><p class="detail-value">${room.occupiedBeds}</p></div>
        <div class="detail-item"><p class="detail-label">Available Beds</p><p class="detail-value">${getAvailableBeds(room)}</p></div>
        <div class="detail-item"><p class="detail-label">Status</p><p class="detail-value">${room.status}</p></div>
    `;
    detailsModal.classList.remove("hidden");
}

function closeDetailsModal() {
    detailsModal.classList.add("hidden");
}

function openConfirmModal(room) {
    deleteId = room.id;
    confirmText.textContent = `This will remove room ${room.roomNumber} from ${findHostelName(room.hostelId)}.`;
    confirmModal.classList.remove("hidden");
}

function closeConfirmModal() {
    deleteId = null;
    confirmModal.classList.add("hidden");
}

function validateForm() {
    const roomNumber = roomNumberInput.value.trim();
    const capacityRaw = roomCapacityInput.value.trim();
    const occupiedRaw = occupiedCountInput.value.trim();
    const capacity = Number(capacityRaw);
    const occupiedBeds = Number(occupiedRaw);

    if (!hostelSelect.value || !roomNumber || !capacityRaw || !occupiedRaw) {
        return "All fields are required.";
    }

    if (capacity <= 0) {
        return "Capacity must be greater than zero.";
    }

    if (occupiedBeds < 0) {
        return "Occupied beds cannot be negative.";
    }

    if (occupiedBeds > capacity) {
        return "Occupied beds cannot exceed capacity.";
    }

    return "";
}

function syncStatusField() {
    const capacity = Number(roomCapacityInput.value) || 0;
    const occupiedBeds = Number(occupiedCountInput.value) || 0;

    if (roomStatusInput.value === "Maintenance") {
        return;
    }

    roomStatusInput.value = deriveStatus(capacity, occupiedBeds, "Available");
}

hostelFilter.addEventListener("change", (event) => {
    selectedHostelId = event.target.value;
    hostelSelect.value = selectedHostelId;
    renderRooms();
});

roomStatusInput.addEventListener("change", () => {
    if (roomStatusInput.value !== "Maintenance") {
        syncStatusField();
    }
});

[roomCapacityInput, occupiedCountInput].forEach((input) => {
    input.addEventListener("input", () => {
        formError.textContent = "";
        syncStatusField();
    });
});

[roomNumberInput, hostelSelect].forEach((input) => {
    input.addEventListener("input", () => {
        formError.textContent = "";
    });
    input.addEventListener("change", () => {
        formError.textContent = "";
    });
});

roomForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const error = validateForm();
    if (error) {
        formError.textContent = error;
        return;
    }

    const capacity = Number(roomCapacityInput.value);
    const occupiedBeds = Number(occupiedCountInput.value);
    const manualStatus = roomStatusInput.value;

    const record = {
        id: editId || Date.now(),
        hostelId: hostelSelect.value,
        roomNumber: roomNumberInput.value.trim(),
        capacity,
        occupiedBeds,
        status: deriveStatus(capacity, occupiedBeds, manualStatus)
    };

    if (manualStatus === "Maintenance") {
        record.status = "Maintenance";
    }

    if (editId) {
        rooms = rooms.map((room) => room.id === editId ? record : room);
    } else {
        rooms.unshift(record);
    }

    selectedHostelId = record.hostelId;
    hostelFilter.value = selectedHostelId;
    closeFormModal();
    renderRooms();
});

roomsGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
        return;
    }

    const room = rooms.find((item) => item.id === Number(button.dataset.id));
    if (!room) {
        return;
    }

    const action = button.dataset.action;

    if (action === "view") {
        openDetailsModal(room);
    } else if (action === "edit") {
        openFormModal("edit", room);
    } else if (action === "delete") {
        openConfirmModal(room);
    }
});

confirmDeleteButton.addEventListener("click", () => {
    if (deleteId === null) {
        return;
    }

    rooms = rooms.filter((room) => room.id !== deleteId);
    closeConfirmModal();
    renderRooms();
});

openRoomModalButton.addEventListener("click", () => {
    openFormModal("add");
});

mobileMenuButton.addEventListener("click", toggleSidebar);
mobileOverlay.addEventListener("click", closeMobileSidebar);
window.addEventListener("resize", handleResize);

document.querySelectorAll("[data-close-room-modal]").forEach((button) => {
    button.addEventListener("click", closeFormModal);
});

document.querySelectorAll("[data-close-details]").forEach((button) => {
    button.addEventListener("click", closeDetailsModal);
});

document.querySelectorAll("[data-close-confirm]").forEach((button) => {
    button.addEventListener("click", closeConfirmModal);
});

[roomModal, detailsModal, confirmModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target !== modal) {
            return;
        }

        if (modal === roomModal) {
            closeFormModal();
        } else if (modal === detailsModal) {
            closeDetailsModal();
        } else {
            closeConfirmModal();
        }
    });
});

handleResize();
populateHostelOptions();
renderRooms();
