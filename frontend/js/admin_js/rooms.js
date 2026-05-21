const API = {
    hostels: "http://localhost:5000/api/hostels",
    rooms: "http://localhost:5000/api/rooms",
    roomMeta: "http://localhost:5000/api/rooms/meta"
};

const body = document.body;
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");
const hostelFilter = document.getElementById("hostelFilter");
const roomSearchInput = document.getElementById("roomSearch");
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
const roomFloorInput = document.getElementById("roomFloor");
const roomTypeInput = document.getElementById("roomType");
const roomCapacityInput = document.getElementById("roomCapacity");
const monthlyFeeInput = document.getElementById("monthlyFee");
const roomStatusInput = document.getElementById("roomStatus");
const detailsTitle = document.getElementById("detailsTitle");
const detailsContent = document.getElementById("detailsContent");
const confirmText = document.getElementById("confirmText");
const confirmDeleteButton = document.getElementById("confirmDelete");

const fieldMap = {
    hostel_id: { input: hostelSelect, error: document.getElementById("hostelSelectError") },
    room_number: { input: roomNumberInput, error: document.getElementById("roomNumberError") },
    floor: { input: roomFloorInput, error: document.getElementById("roomFloorError") },
    room_type: { input: roomTypeInput, error: document.getElementById("roomTypeError") },
    capacity: { input: roomCapacityInput, error: document.getElementById("roomCapacityError") },
    monthly_fee: { input: monthlyFeeInput, error: document.getElementById("monthlyFeeError") },
    status: { input: roomStatusInput, error: document.getElementById("roomStatusError") }
};

let hostels = [];
let rooms = [];
let roomMeta = { roomTypes: [], roomStatuses: [] };
let selectedHostelId = "";
let roomSearchTerm = "";
let editId = null;
let deleteId = null;
let loadRequestId = 0;
let roomMetaWarning = "";

const request = async (url, options = {}) => {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(
            Array.isArray(payload.errors) && payload.errors.length
                ? payload.errors.map((item) => item.message).join(" ")
                : (payload.message || "Request failed.")
        );
        error.details = Array.isArray(payload.errors) ? payload.errors : [];
        throw error;
    }
    return payload;
};

const animateCounter = (element, target) => {
    const start = Number(element.textContent.replace(/,/g, "")) || 0;
    const startTime = performance.now();
    const duration = 700;

    const update = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(start + (target - start) * eased).toLocaleString();
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    };

    requestAnimationFrame(update);
};

const safeText = (value, fallback = "Not Available") => {
    const normalized = typeof value === "string" ? value.trim() : value;
    return normalized ? normalized : fallback;
};

const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeSearchTerm = (value) => typeof value === "string"
    ? value.toUpperCase().replace(/\s+/g, " ").trim()
    : "";

const normalizeRoomNumberInput = (value) => typeof value === "string"
    ? value.toUpperCase().replace(/\s*-\s*/g, "-").replace(/\s+/g, "").trim()
    : "";

const buildUrl = (baseUrl, params = {}) => {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, String(value));
        }
    });
    return url.toString();
};

const setFormError = (message) => {
    formError.textContent = message;
    formError.classList.toggle("hidden", !message);
};

const setFieldError = (field, message = "") => {
    const config = fieldMap[field];
    if (!config) {
        return;
    }

    config.error.textContent = message;
    config.error.classList.toggle("hidden", !message);
    config.input.classList.toggle("border-rose-400/60", Boolean(message));
    config.input.classList.toggle("ring-4", Boolean(message));
    config.input.classList.toggle("ring-rose-500/10", Boolean(message));
    config.input.setAttribute("aria-invalid", message ? "true" : "false");
};

const clearFieldErrors = () => {
    Object.keys(fieldMap).forEach((field) => setFieldError(field, ""));
};

const applyApiErrors = (error) => {
    if (!Array.isArray(error.details) || !error.details.length) {
        return;
    }

    error.details.forEach((item) => {
        if (item?.field && item?.message) {
            setFieldError(item.field, item.message);
        }
    });
};

const isValidRoomNumber = (value) => /^[A-Z]-\d{3}$/.test(value);

const normalizeRoom = (row) => ({
    id: Number(row.room_id || row.id),
    hostelId: Number(row.hostel_id || row.hostelId),
    hostel: safeText(row.hostel_name || row.hostel, "Unassigned Hostel"),
    roomNumber: safeText(row.room_number ?? row.roomNumber ?? "", ""),
    floor: Number(row.floor ?? 0),
    roomType: row.room_type ?? row.roomType ?? null,
    capacity: Number(row.capacity || 0),
    monthlyFee: Number(row.monthly_fee ?? row.monthlyFee ?? 0),
    occupiedBeds: Number(row.occupied_beds ?? row.occupiedBeds ?? 0),
    availableBeds: Number(row.available_beds ?? row.availableBeds ?? 0),
    status: safeText(row.status, "Unknown")
});

const populateRoomMetaOptions = () => {
    const roomTypeOptions = [`<option value="">No Room Type</option>`]
        .concat(roomMeta.roomTypes.map((roomType) => `<option value="${escapeHtml(roomType)}">${escapeHtml(roomType)}</option>`))
        .join("");
    const roomStatusOptions = [`<option value="">Select Status</option>`]
        .concat(roomMeta.roomStatuses.map((status) => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`))
        .join("");

    const selectedRoomType = roomTypeInput.value;
    const selectedRoomStatus = roomStatusInput.value;

    roomTypeInput.innerHTML = roomTypeOptions;
    roomStatusInput.innerHTML = roomStatusOptions;

    roomTypeInput.value = roomMeta.roomTypes.includes(selectedRoomType) ? selectedRoomType : "";
    roomStatusInput.value = roomMeta.roomStatuses.includes(selectedRoomStatus) ? selectedRoomStatus : "";
};

const openMobileSidebar = () => {
    body.classList.add("sidebar-open");
    mobileOverlay.classList.add("active");
};

const closeMobileSidebar = () => {
    body.classList.remove("sidebar-open");
    mobileOverlay.classList.remove("active");
};

const toggleSidebar = () => body.classList.contains("sidebar-open") ? closeMobileSidebar() : openMobileSidebar();
const handleResize = () => closeMobileSidebar();

const populateHostelOptions = () => {
    hostelFilter.innerHTML = [`<option value="">All Hostels</option>`]
        .concat(hostels.map((hostel) => `<option value="${hostel.id}">${escapeHtml(hostel.name)}</option>`))
        .join("");
    hostelSelect.innerHTML = hostels.map((hostel) => `<option value="${hostel.id}">${escapeHtml(hostel.name)}</option>`).join("");
    hostelFilter.value = selectedHostelId;
    roomSearchInput.value = roomSearchTerm;

    if (!hostelSelect.value && hostels[0]) {
        hostelSelect.value = String(hostels[0].id);
    }
};

const updateSummary = () => {
    const totals = rooms.reduce((acc, room) => ({
        capacity: acc.capacity + room.capacity,
        occupied: acc.occupied + room.occupiedBeds
    }), { capacity: 0, occupied: 0 });

    animateCounter(filteredRoomsEl, rooms.length);
    animateCounter(totalBedsEl, totals.capacity);
    animateCounter(occupiedBedsEl, totals.occupied);
    animateCounter(availableBedsEl, Math.max(totals.capacity - totals.occupied, 0));
};

const renderRooms = () => {
    roomsGrid.innerHTML = "";

    if (!rooms.length) {
        const emptyMessage = selectedHostelId || roomSearchTerm
            ? "No rooms match the current hostel filter and room search."
            : "No rooms found.";
        roomsGrid.innerHTML = `<article class="room-card p-6 text-slate-300">${escapeHtml(emptyMessage)}</article>`;
        updateSummary();
        return;
    }

    rooms.forEach((room) => {
        const card = document.createElement("article");
        card.className = "room-card";
        card.innerHTML = `
            <div class="mb-5 flex items-start justify-between gap-4">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/75">${escapeHtml(room.hostel)}</p>
                    <h3 class="mt-2 text-2xl font-bold text-white">${escapeHtml(String(room.roomNumber))}</h3>
                </div>
                <span class="room-chip">${room.occupiedBeds}/${room.capacity}</span>
            </div>
            <div class="space-y-3 text-sm text-slate-300">
                <div class="flex items-center justify-between gap-4"><span>Floor</span><span class="font-semibold text-white">${room.floor}</span></div>
                <div class="flex items-center justify-between gap-4"><span>Capacity</span><span class="font-semibold text-white">${room.capacity} beds</span></div>
                <div class="flex items-center justify-between gap-4"><span>Occupied Beds</span><span class="font-semibold text-white">${room.occupiedBeds}/${room.capacity}</span></div>
                <div class="flex items-center justify-between gap-4"><span>Room Type</span><span class="font-semibold text-white">${escapeHtml(room.roomType || "N/A")}</span></div>
                <div class="flex items-center justify-between gap-4"><span>Monthly Fee</span><span class="font-semibold text-white">PKR ${room.monthlyFee.toLocaleString()}</span></div>
                <div class="pt-2"><span class="status-badge status-${room.status.toLowerCase().replace(/\s+/g, "-")}">${escapeHtml(room.status)}</span></div>
            </div>
            <div class="mt-6 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <button class="card-action" data-action="edit" data-id="${room.id}">Edit</button>
                    <button class="card-action" data-action="delete" data-id="${room.id}">Delete</button>
                </div>
                <button class="details-btn rounded-2xl px-4 py-2.5 text-sm font-semibold text-white" data-action="view" data-id="${room.id}">View Details</button>
            </div>
        `;
        roomsGrid.appendChild(card);
    });

    updateSummary();
};

const loadRooms = async (requestId) => {
    const payload = await request(buildUrl(API.rooms, { hostelId: selectedHostelId, search: roomSearchTerm }));
    if (requestId !== loadRequestId) {
        return;
    }
    rooms = (payload.data || []).map(normalizeRoom);
    renderRooms();
};

const loadPageData = async () => {
    const requestId = ++loadRequestId;
    roomsGrid.innerHTML = `<article class="room-card p-6 text-slate-300">Loading rooms...</article>`;

    try {
        const [hostelsPayload, roomMetaPayload] = await Promise.all([
            request(API.hostels),
            request(API.roomMeta)
        ]);

        if (requestId !== loadRequestId) {
            return;
        }

        hostels = (hostelsPayload.data || []).map((row) => ({
            id: Number(row.hostel_id),
            name: safeText(row.hostel_name, "Unnamed Hostel")
        }));
        roomMeta = {
            roomTypes: Array.isArray(roomMetaPayload.roomTypes) ? roomMetaPayload.roomTypes : (Array.isArray(roomMetaPayload.data?.roomTypes) ? roomMetaPayload.data.roomTypes : []),
            roomStatuses: Array.isArray(roomMetaPayload.roomStatuses) ? roomMetaPayload.roomStatuses : (Array.isArray(roomMetaPayload.data?.roomStatuses) ? roomMetaPayload.data.roomStatuses : [])
        };
        roomMetaWarning = roomMeta.roomStatuses.length ? "" : "Room status options are temporarily unavailable.";
        populateHostelOptions();
        populateRoomMetaOptions();

        await loadRooms(requestId);
    } catch (error) {
        roomsGrid.innerHTML = `<article class="room-card p-6 text-slate-300">${escapeHtml(error.message)}</article>`;
    }
};

const resetForm = () => {
    roomForm.reset();
    editId = null;
    hostelSelect.value = selectedHostelId || String(hostels[0]?.id || "");
    populateRoomMetaOptions();
    roomTypeInput.value = "";
    roomStatusInput.value = roomMeta.roomStatuses.includes("Available") ? "Available" : (roomMeta.roomStatuses[0] || "");
    clearFieldErrors();
    setFormError("");
};

const openFormModal = (mode, room = null) => {
    resetForm();
    modalTitle.textContent = mode === "edit" ? "Edit Room" : "Add Room";

    if (!roomMeta.roomStatuses.length) {
        setFormError(roomMetaWarning || "Room status options could not be loaded.");
    }

    if (mode === "edit" && room) {
        hostelSelect.value = String(room.hostelId);
        roomNumberInput.value = String(room.roomNumber);
        roomFloorInput.value = String(room.floor);
        roomTypeInput.value = room.roomType || "";
        roomCapacityInput.value = String(room.capacity);
        monthlyFeeInput.value = String(room.monthlyFee);
        roomStatusInput.value = room.status;
        editId = room.id;
    }

    roomModal.classList.remove("hidden");
};

const closeFormModal = () => {
    roomModal.classList.add("hidden");
    resetForm();
};

const openDetailsModal = (room) => {
    detailsTitle.textContent = String(room.roomNumber);
    detailsContent.innerHTML = `
        <div class="detail-item"><p class="detail-label">Room Number</p><p class="detail-value">${escapeHtml(String(room.roomNumber))}</p></div>
        <div class="detail-item"><p class="detail-label">Hostel Name</p><p class="detail-value">${escapeHtml(room.hostel)}</p></div>
        <div class="detail-item"><p class="detail-label">Floor</p><p class="detail-value">${room.floor}</p></div>
        <div class="detail-item"><p class="detail-label">Room Type</p><p class="detail-value">${escapeHtml(room.roomType || "N/A")}</p></div>
        <div class="detail-item"><p class="detail-label">Capacity</p><p class="detail-value">${room.capacity} beds</p></div>
        <div class="detail-item"><p class="detail-label">Monthly Fee</p><p class="detail-value">${room.monthlyFee.toLocaleString()} PKR</p></div>
        <div class="detail-item"><p class="detail-label">Occupied Beds</p><p class="detail-value">${room.occupiedBeds}</p></div>
        <div class="detail-item"><p class="detail-label">Available Beds</p><p class="detail-value">${room.availableBeds}</p></div>
        <div class="detail-item"><p class="detail-label">Status</p><p class="detail-value">${escapeHtml(room.status)}</p></div>
    `;
    detailsModal.classList.remove("hidden");
};

const closeDetailsModal = () => detailsModal.classList.add("hidden");

const openConfirmModal = (room) => {
    deleteId = room.id;
    confirmText.textContent = `This will remove room ${room.roomNumber} from ${room.hostel}.`;
    confirmModal.classList.remove("hidden");
};

const closeConfirmModal = () => {
    deleteId = null;
    confirmModal.classList.add("hidden");
};

const validateRoomForm = () => {
    const values = {
        hostel_id: hostelSelect.value,
        room_number: normalizeRoomNumberInput(roomNumberInput.value),
        floor: Number(roomFloorInput.value),
        room_type: roomTypeInput.value,
        capacity: Number(roomCapacityInput.value),
        monthly_fee: Number(monthlyFeeInput.value),
        status: roomStatusInput.value
    };

    const errors = {};

    if (!values.hostel_id) {
        errors.hostel_id = "Hostel is required.";
    }

    if (!values.room_number) {
        errors.room_number = "Room number is required.";
    } else if (!isValidRoomNumber(values.room_number)) {
        errors.room_number = "Room number must follow the format A-101, B-203, or C-304.";
    }

    if (!Number.isInteger(values.floor) || values.floor < 0) {
        errors.floor = "Floor is required and must be 0 or greater.";
    }

    if (values.room_type && roomMeta.roomTypes.length && !roomMeta.roomTypes.includes(values.room_type)) {
        errors.room_type = "Select a valid room type or leave it empty.";
    }

    if (!Number.isInteger(values.capacity) || values.capacity <= 0) {
        errors.capacity = "Capacity must be a whole number greater than zero.";
    }

    if (!Number.isFinite(values.monthly_fee) || values.monthly_fee < 0) {
        errors.monthly_fee = "Monthly fee must be 0 or greater.";
    }

    if (!roomMeta.roomStatuses.length) {
        errors.status = roomMetaWarning || "Status options could not be loaded.";
    } else if (!roomMeta.roomStatuses.includes(values.status)) {
        errors.status = "Select a valid status.";
    }

    return errors;
};

const applyValidationErrors = (errors) => {
    clearFieldErrors();
    Object.entries(errors).forEach(([field, message]) => setFieldError(field, message));
};

const buildRoomPayload = () => ({
    hostel_id: Number(hostelSelect.value),
    room_number: normalizeRoomNumberInput(roomNumberInput.value),
    floor: Number(roomFloorInput.value),
    room_type: roomTypeInput.value || null,
    capacity: Number(roomCapacityInput.value),
    monthly_fee: Number(monthlyFeeInput.value),
    status: roomStatusInput.value
});

roomForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const errors = validateRoomForm();
    applyValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
        setFormError("Correct the highlighted fields before saving.");
        return;
    }

    const payload = buildRoomPayload();

    try {
        if (editId) {
            await request(`${API.rooms}/${editId}`, { method: "PUT", body: JSON.stringify(payload) });
            window.alert("Room updated successfully.");
        } else {
            await request(API.rooms, { method: "POST", body: JSON.stringify(payload) });
            window.alert("Room added successfully.");
        }
        closeFormModal();
        await loadPageData();
    } catch (error) {
        applyApiErrors(error);
        setFormError(error.message);
    }
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

    if (button.dataset.action === "view") {
        openDetailsModal(room);
    }
    if (button.dataset.action === "edit") {
        openFormModal("edit", room);
    }
    if (button.dataset.action === "delete") {
        openConfirmModal(room);
    }
});

confirmDeleteButton.addEventListener("click", async () => {
    if (deleteId === null) {
        return;
    }

    try {
        await request(`${API.rooms}/${deleteId}`, { method: "DELETE" });
        window.alert("Room deleted successfully.");
        closeConfirmModal();
        await loadPageData();
    } catch (error) {
        window.alert(error.message);
    }
});

hostelFilter.addEventListener("change", async (event) => {
    selectedHostelId = event.target.value;
    hostelSelect.value = selectedHostelId || String(hostels[0]?.id || "");
    await loadPageData();
});

roomSearchInput.addEventListener("input", async (event) => {
    roomSearchTerm = normalizeSearchTerm(event.target.value);
    event.target.value = roomSearchTerm;
    await loadPageData();
});

openRoomModalButton.addEventListener("click", () => openFormModal("add"));
mobileMenuButton.addEventListener("click", toggleSidebar);
mobileOverlay.addEventListener("click", closeMobileSidebar);
window.addEventListener("resize", handleResize);
document.querySelectorAll("[data-close-room-modal]").forEach((button) => button.addEventListener("click", closeFormModal));
document.querySelectorAll("[data-close-details]").forEach((button) => button.addEventListener("click", closeDetailsModal));
document.querySelectorAll("[data-close-confirm]").forEach((button) => button.addEventListener("click", closeConfirmModal));
[roomModal, detailsModal, confirmModal].forEach((modal) => modal.addEventListener("click", (event) => {
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
}));

[
    ["hostel_id", hostelSelect, "change"],
    ["room_number", roomNumberInput, "input"],
    ["floor", roomFloorInput, "input"],
    ["room_type", roomTypeInput, "change"],
    ["capacity", roomCapacityInput, "input"],
    ["monthly_fee", monthlyFeeInput, "input"],
    ["status", roomStatusInput, "change"]
].forEach(([field, input, eventName]) => {
    input.addEventListener(eventName, () => {
        if (field === "room_number") {
            roomNumberInput.value = normalizeRoomNumberInput(roomNumberInput.value);
        }
        setFieldError(field, "");
        setFormError("");
    });
});

handleResize();
void loadPageData();
