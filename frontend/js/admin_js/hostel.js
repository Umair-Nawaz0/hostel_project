const body = document.body;
const sidebarToggle = document.getElementById("sidebarToggle");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");

const hostelGrid = document.getElementById("hostelGrid");
const totalHostelsEl = document.getElementById("totalHostels");
const totalCapacityEl = document.getElementById("totalCapacity");
const totalRoomsEl = document.getElementById("totalRooms");
const occupiedRoomsEl = document.getElementById("occupiedRooms");

const openAddHostelButton = document.getElementById("openAddHostel");
const hostelModal = document.getElementById("hostelModal");
const detailsModal = document.getElementById("detailsModal");
const confirmModal = document.getElementById("confirmModal");
const hostelForm = document.getElementById("hostelForm");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");

const hostelNameInput = document.getElementById("hostelName");
const hostelLocationInput = document.getElementById("hostelLocation");
const hostelAddressInput = document.getElementById("hostelAddress");
const hostelCapacityInput = document.getElementById("hostelCapacity");
const hostelRoomsInput = document.getElementById("hostelRooms");
const wardenNameInput = document.getElementById("wardenName");

const detailsTitle = document.getElementById("detailsTitle");
const detailsContent = document.getElementById("detailsContent");
const confirmText = document.getElementById("confirmText");
const confirmDeleteButton = document.getElementById("confirmDelete");

let hostels = [
    {
        id: 1,
        name: "Hostel A",
        location: "Lahore",
        address: "12 Canal Road, Gulberg, Lahore",
        capacity: 100,
        totalRooms: 50,
        occupiedRooms: 42,
        warden: "Ayesha Malik"
    },
    {
        id: 2,
        name: "Hostel B",
        location: "Islamabad",
        address: "44 Street 8, G-11 Markaz, Islamabad",
        capacity: 140,
        totalRooms: 68,
        occupiedRooms: 55,
        warden: "Hamza Rauf"
    },
    {
        id: 3,
        name: "Hostel C",
        location: "Karachi",
        address: "9 University Avenue, Gulshan-e-Iqbal, Karachi",
        capacity: 90,
        totalRooms: 36,
        occupiedRooms: 27,
        warden: "Sana Ahmed"
    }
];

let editId = null;
let deleteId = null;

function isDesktop() {
    return window.innerWidth >= 1024;
}

function openMobileSidebar() {
    body.classList.add("sidebar-open");
    mobileOverlay.classList.add("active");
}

function closeMobileSidebar() {
    body.classList.remove("sidebar-open");
    mobileOverlay.classList.remove("active");
}

function handleSidebarToggle() {
    if (isDesktop()) {
        body.classList.toggle("sidebar-collapsed");
        return;
    }

    if (body.classList.contains("sidebar-open")) {
        closeMobileSidebar();
    } else {
        openMobileSidebar();
    }
}

function handleResize() {
    if (isDesktop()) {
        closeMobileSidebar();
    } else {
        body.classList.remove("sidebar-collapsed");
    }
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

function updateSummary() {
    const totals = hostels.reduce((acc, hostel) => {
        acc.capacity += hostel.capacity;
        acc.rooms += hostel.totalRooms;
        acc.occupied += hostel.occupiedRooms;
        return acc;
    }, { capacity: 0, rooms: 0, occupied: 0 });

    animateCounter(totalHostelsEl, hostels.length);
    animateCounter(totalCapacityEl, totals.capacity);
    animateCounter(totalRoomsEl, totals.rooms);
    animateCounter(occupiedRoomsEl, totals.occupied);
}

function getAvailableRooms(hostel) {
    return hostel.totalRooms - hostel.occupiedRooms;
}

function renderHostels() {
    hostelGrid.innerHTML = "";

    hostels.forEach((hostel) => {
        const card = document.createElement("article");
        card.className = "hostel-card";
        card.innerHTML = `
            <div class="mb-5 flex items-start justify-between gap-4">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/75">${hostel.location}</p>
                    <h3 class="mt-2 text-2xl font-bold text-white">${hostel.name}</h3>
                </div>
                <span class="metric-chip">${hostel.occupiedRooms}/${hostel.totalRooms}</span>
            </div>

            <div class="space-y-3 text-sm text-slate-300">
                <div class="flex items-center justify-between gap-4">
                    <span>Capacity</span>
                    <span class="font-semibold text-white">${hostel.capacity}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                    <span>Total Rooms</span>
                    <span class="font-semibold text-white">${hostel.totalRooms}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                    <span>Occupied Rooms</span>
                    <span class="font-semibold text-white">${hostel.occupiedRooms}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                    <span>Warden</span>
                    <span class="font-semibold text-white">${hostel.warden}</span>
                </div>
                <div class="address-box rounded-2xl px-4 py-3 text-slate-300">
                    ${hostel.address}
                </div>
            </div>

            <div class="mt-6 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <button class="card-action" data-action="edit" data-id="${hostel.id}" title="Edit hostel" aria-label="Edit hostel">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                    </button>
                    <button class="card-action" data-action="delete" data-id="${hostel.id}" title="Delete hostel" aria-label="Delete hostel">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path></svg>
                    </button>
                </div>
                <button class="details-btn rounded-2xl px-4 py-2.5 text-sm font-semibold text-white" data-action="view" data-id="${hostel.id}">
                    View Details
                </button>
            </div>
        `;

        hostelGrid.appendChild(card);
    });

    updateSummary();
}

function resetForm() {
    hostelForm.reset();
    formError.textContent = "";
    editId = null;
}

function openFormModal(mode, hostel = null) {
    resetForm();
    modalTitle.textContent = mode === "edit" ? "Edit Hostel" : "Add Hostel";

    if (mode === "edit" && hostel) {
        hostelNameInput.value = hostel.name;
        hostelLocationInput.value = hostel.location;
        hostelAddressInput.value = hostel.address;
        hostelCapacityInput.value = hostel.capacity;
        hostelRoomsInput.value = hostel.totalRooms;
        wardenNameInput.value = hostel.warden;
        editId = hostel.id;
    }

    hostelModal.classList.remove("hidden");
}

function closeFormModal() {
    hostelModal.classList.add("hidden");
    resetForm();
}

function openDetailsModal(hostel) {
    detailsTitle.textContent = hostel.name;
    detailsContent.innerHTML = `
        <div class="detail-item"><p class="detail-label">Hostel Name</p><p class="detail-value">${hostel.name}</p></div>
        <div class="detail-item"><p class="detail-label">Location</p><p class="detail-value">${hostel.location}</p></div>
        <div class="detail-item sm:col-span-2"><p class="detail-label">Full Address</p><p class="detail-value">${hostel.address}</p></div>
        <div class="detail-item"><p class="detail-label">Capacity</p><p class="detail-value">${hostel.capacity} students</p></div>
        <div class="detail-item"><p class="detail-label">Total Rooms</p><p class="detail-value">${hostel.totalRooms}</p></div>
        <div class="detail-item"><p class="detail-label">Available Rooms</p><p class="detail-value">${getAvailableRooms(hostel)}</p></div>
        <div class="detail-item"><p class="detail-label">Occupied Rooms</p><p class="detail-value">${hostel.occupiedRooms}</p></div>
        <div class="detail-item"><p class="detail-label">Warden Name</p><p class="detail-value">${hostel.warden}</p></div>
    `;
    detailsModal.classList.remove("hidden");
}

function closeDetailsModal() {
    detailsModal.classList.add("hidden");
}

function openConfirmModal(hostel) {
    deleteId = hostel.id;
    confirmText.textContent = `This will remove ${hostel.name} from the hostel list.`;
    confirmModal.classList.remove("hidden");
}

function closeConfirmModal() {
    deleteId = null;
    confirmModal.classList.add("hidden");
}

function validateForm() {
    const name = hostelNameInput.value.trim();
    const location = hostelLocationInput.value.trim();
    const address = hostelAddressInput.value.trim();
    const capacity = Number(hostelCapacityInput.value);
    const totalRooms = Number(hostelRoomsInput.value);
    const warden = wardenNameInput.value.trim();

    if (!name || !location || !address || !capacity || !totalRooms || !warden) {
        return "All fields are required.";
    }

    if (capacity <= 0 || totalRooms <= 0) {
        return "Capacity and total rooms must be greater than zero.";
    }

    return "";
}

hostelForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const error = validateForm();
    if (error) {
        formError.textContent = error;
        return;
    }

    const record = {
        id: editId || Date.now(),
        name: hostelNameInput.value.trim(),
        location: hostelLocationInput.value.trim(),
        address: hostelAddressInput.value.trim(),
        capacity: Number(hostelCapacityInput.value),
        totalRooms: Number(hostelRoomsInput.value),
        occupiedRooms: editId
            ? hostels.find((hostel) => hostel.id === editId).occupiedRooms
            : Math.max(1, Math.floor(Number(hostelRoomsInput.value) * 0.6)),
        warden: wardenNameInput.value.trim()
    };

    if (editId) {
        hostels = hostels.map((hostel) => hostel.id === editId ? record : hostel);
    } else {
        hostels.unshift(record);
    }

    closeFormModal();
    renderHostels();
});

hostelGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
        return;
    }

    const hostel = hostels.find((item) => item.id === Number(button.dataset.id));
    if (!hostel) {
        return;
    }

    const action = button.dataset.action;

    if (action === "view") {
        openDetailsModal(hostel);
    }

    if (action === "edit") {
        openFormModal("edit", hostel);
    }

    if (action === "delete") {
        openConfirmModal(hostel);
    }
});

confirmDeleteButton.addEventListener("click", () => {
    if (deleteId === null) {
        return;
    }

    hostels = hostels.filter((hostel) => hostel.id !== deleteId);
    closeConfirmModal();
    renderHostels();
});

openAddHostelButton.addEventListener("click", () => {
    openFormModal("add");
});

sidebarToggle.addEventListener("click", handleSidebarToggle);
mobileMenuButton.addEventListener("click", openMobileSidebar);
mobileOverlay.addEventListener("click", closeMobileSidebar);
window.addEventListener("resize", handleResize);

document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeFormModal);
});

document.querySelectorAll("[data-close-details]").forEach((button) => {
    button.addEventListener("click", closeDetailsModal);
});

document.querySelectorAll("[data-close-confirm]").forEach((button) => {
    button.addEventListener("click", closeConfirmModal);
});

[hostelModal, detailsModal, confirmModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target !== modal) {
            return;
        }

        if (modal === hostelModal) {
            closeFormModal();
        } else if (modal === detailsModal) {
            closeDetailsModal();
        } else {
            closeConfirmModal();
        }
    });
});

[hostelNameInput, hostelLocationInput, hostelAddressInput, hostelCapacityInput, hostelRoomsInput, wardenNameInput].forEach((input) => {
    input.addEventListener("input", () => {
        formError.textContent = "";
    });
});

handleResize();
renderHostels();
