const API = {
    hostels: "http://localhost:5000/api/hostels",
    wardens: "http://localhost:5000/api/wardens"
};

const PHONE_REGEX = /^[+0-9()\-\s]{7,20}$/;
const HOSTEL_NAME_MIN_LENGTH = 3;
const HOSTEL_NAME_MAX_LENGTH = 120;
const CITY_MAX_LENGTH = 80;

const body = document.body;
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");
const hostelFilter = document.getElementById("hostelFilter");

const hostelGrid = document.getElementById("hostelGrid");
const totalHostelsEl = document.getElementById("totalHostels");
const availableRoomsEl = document.getElementById("availableRooms");
const totalRoomsEl = document.getElementById("totalRooms");
const occupiedRoomsEl = document.getElementById("occupiedRooms");
const pageMessage = document.getElementById("pageMessage");

const openAddHostelButton = document.getElementById("openAddHostel");
const hostelModal = document.getElementById("hostelModal");
const detailsModal = document.getElementById("detailsModal");
const confirmModal = document.getElementById("confirmModal");
const hostelForm = document.getElementById("hostelForm");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");

const hostelNameInput = document.getElementById("hostelName");
const hostelCityInput = document.getElementById("hostelCity");
const hostelAddressInput = document.getElementById("hostelAddress");
const hostelRoomsInput = document.getElementById("hostelRooms");
const contactPhoneInput = document.getElementById("contactPhone");
const hostelEmailInput = document.getElementById("hostelEmail");
const establishedYearInput = document.getElementById("establishedYear");
const wardenSelect = document.getElementById("wardenSelect");

const detailsTitle = document.getElementById("detailsTitle");
const detailsContent = document.getElementById("detailsContent");
const confirmText = document.getElementById("confirmText");
const confirmDeleteButton = document.getElementById("confirmDelete");
const submitButton = hostelForm.querySelector('button[type="submit"]');

const fieldMap = {
    hostel_name: {
        input: hostelNameInput,
        error: document.getElementById("hostelNameError")
    },
    city: {
        input: hostelCityInput,
        error: document.getElementById("hostelCityError")
    },
    address: {
        input: hostelAddressInput,
        error: document.getElementById("hostelAddressError")
    },
    total_rooms: {
        input: hostelRoomsInput,
        error: document.getElementById("hostelRoomsError")
    },
    contact_phone: {
        input: contactPhoneInput,
        error: document.getElementById("contactPhoneError")
    },
    email: {
        input: hostelEmailInput,
        error: document.getElementById("hostelEmailError")
    },
    established_yr: {
        input: establishedYearInput,
        error: document.getElementById("establishedYearError")
    },
    warden_id: {
        input: wardenSelect,
        error: document.getElementById("wardenSelectError")
    }
};

let hostels = [];
let filteredHostels = [];
let wardens = [];
let selectedHostelId = "";
let editId = null;
let deleteId = null;
let isSubmitting = false;
let isDeleting = false;
let messageTimeoutId = null;
let detailsRequestId = 0;

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

function setFormError(message) {
    formError.textContent = message;
    formError.classList.toggle("hidden", !message);
}

function showPageMessage(message, type = "success") {
    if (messageTimeoutId) {
        window.clearTimeout(messageTimeoutId);
        messageTimeoutId = null;
    }

    pageMessage.textContent = message;
    pageMessage.className = "mt-4 rounded-2xl border px-4 py-3 text-sm";

    if (type === "success") {
        pageMessage.classList.add("border-emerald-400/30", "bg-emerald-500/10", "text-emerald-200");
    } else {
        pageMessage.classList.add("border-rose-400/30", "bg-rose-500/10", "text-rose-200");
    }

    pageMessage.classList.remove("hidden");
    messageTimeoutId = window.setTimeout(() => {
        pageMessage.classList.add("hidden");
    }, 4000);
}

function setFieldError(field, message = "") {
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
}

function clearFieldErrors() {
    Object.keys(fieldMap).forEach((field) => {
        setFieldError(field, "");
    });
}

function normalizeHostel(hostel) {
    const rawCity = hostel.city || hostel.location || "";
    const rawAddress = hostel.address || "";
    const rawContactPhone = hostel.contact_phone || "";
    const rawEmail = hostel.email || "";
    const rawEstablishedYear = hostel.established_yr === null || hostel.established_yr === undefined
        ? null
        : Number(hostel.established_yr);

    return {
        id: Number(hostel.hostel_id ?? hostel.id),
        name: hostel.hostel_name || "Unnamed Hostel",
        city: rawCity || "Not Available",
        location: rawCity || "Not Available",
        address: rawAddress || "Not Available",
        totalRooms: Number(hostel.total_rooms) || 0,
        occupiedRooms: Number(hostel.occupied_rooms) || 0,
        availableRooms: Number(hostel.available_rooms) || 0,
        wardenId: hostel.warden_id ? Number(hostel.warden_id) : null,
        warden: hostel.warden_name || "Not Assigned",
        wardenPhone: hostel.warden_phone || "Not Available",
        wardenEmail: hostel.warden_email || "",
        contactPhone: rawContactPhone || "Not Available",
        email: rawEmail,
        establishedYear: rawEstablishedYear,
        rawCity,
        rawAddress,
        rawContactPhone,
        rawEmail
    };
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatDetailValue(value, fallback = "N/A") {
    if (value === null || value === undefined) {
        return fallback;
    }

    if (typeof value === "string") {
        const normalized = value.trim();
        return normalized ? normalized : fallback;
    }

    return String(value);
}

function calculateOccupancyPercentage(hostel) {
    if (!hostel.totalRooms) {
        return 0;
    }

    return Math.round((hostel.occupiedRooms / hostel.totalRooms) * 100);
}

function renderDetailsLoadingState(hostelName = "Hostel Details") {
    detailsTitle.textContent = hostelName;
    detailsContent.innerHTML = `
        <div class="details-empty-state">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200/80">Loading</p>
            <p class="mt-2 text-sm text-slate-300">Fetching the latest hostel, statistics, and warden information from the database.</p>
        </div>
    `;
}

function renderDetailsErrorState(message) {
    detailsContent.innerHTML = `
        <div class="details-empty-state">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-rose-200">Unable to load details</p>
            <p class="mt-2 text-sm text-slate-300">${escapeHtml(message)}</p>
        </div>
    `;
}

function buildStatCard(label, value, note, icon) {
    return `
        <article class="details-stat-card">
            <p class="details-stat-label">
                ${icon}
                <span>${label}</span>
            </p>
            <p class="details-stat-value">${escapeHtml(value)}</p>
            <p class="details-stat-note">${escapeHtml(note)}</p>
        </article>
    `;
}

function buildDetailCard(label, value, fallback = "N/A", wide = false) {
    return `
        <article class="detail-item ${wide ? "detail-wide" : ""}">
            <p class="detail-label">${escapeHtml(label)}</p>
            <p class="detail-value">${escapeHtml(formatDetailValue(value, fallback))}</p>
        </article>
    `;
}

function renderDetailsContent(hostel) {
    const occupancyPercentage = calculateOccupancyPercentage(hostel);
    const safeHostelName = escapeHtml(formatDetailValue(hostel.name, "Hostel"));
    const safeCity = escapeHtml(formatDetailValue(hostel.rawCity, "N/A"));
    const safeWarden = escapeHtml(formatDetailValue(hostel.warden, "Not Assigned"));
    const safeWardenPhone = escapeHtml(formatDetailValue(hostel.wardenPhone === "Not Available" ? "" : hostel.wardenPhone, "N/A"));
    const safeWardenEmail = escapeHtml(formatDetailValue(hostel.wardenEmail, "N/A"));

    detailsTitle.textContent = `${formatDetailValue(hostel.name, "Hostel")} Details`;
    detailsContent.innerHTML = `
        <section class="details-hero">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p class="details-eyebrow">Hostel Profile</p>
                    <h3 class="mt-2 text-3xl font-semibold text-white">${safeHostelName}</h3>
                    <p class="details-subtitle">Live ERP snapshot of hostel identity, room utilization, and assigned warden details.</p>
                </div>
                <div class="details-pill-row">
                    <span class="details-pill">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21V7l8-4 8 4v14"></path><path d="M9 21v-6h6v6"></path></svg>
                        Hostel ID: ${escapeHtml(String(hostel.id))}
                    </span>
                    <span class="details-pill">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 12 7-7 4 4 7-7"></path><path d="M21 10v11H10"></path></svg>
                        Occupancy: ${escapeHtml(String(occupancyPercentage))}%
                    </span>
                </div>
            </div>

            <div class="details-stat-grid">
                ${buildStatCard(
                    "Total Rooms",
                    String(hostel.totalRooms),
                    `${safeCity} campus inventory`,
                    `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h18"></path><path d="M5 7v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7"></path><path d="M9 11h6"></path></svg>`
                )}
                ${buildStatCard(
                    "Occupied Rooms",
                    String(hostel.occupiedRooms),
                    `Currently in use`,
                    `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14"></path><path d="M8 4H6a2 2 0 0 0-2 2v14"></path><path d="M12 4v16"></path><path d="M4 20h16"></path></svg>`
                )}
                ${buildStatCard(
                    "Available Rooms",
                    String(hostel.availableRooms),
                    `Ready for allocation`,
                    `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`
                )}
                ${buildStatCard(
                    "Occupancy Percentage",
                    `${occupancyPercentage}%`,
                    `${hostel.occupiedRooms} of ${hostel.totalRooms} rooms occupied`,
                    `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9"></path><path d="M21 3v9h-9"></path></svg>`
                )}
            </div>
        </section>

        <section class="details-section">
            <div class="details-section-header">
                <span class="details-section-icon">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5.25 9.75V21h13.5V9.75"></path></svg>
                </span>
                <div>
                    <h4 class="details-section-title">Hostel Information</h4>
                    <p class="details-section-copy">Core record details stored in the hostel master table.</p>
                </div>
            </div>

            <div class="details-info-grid">
                ${buildDetailCard("Hostel ID", hostel.id)}
                ${buildDetailCard("Hostel Name", hostel.name)}
                ${buildDetailCard("City", hostel.rawCity)}
                ${buildDetailCard("Total Rooms", hostel.totalRooms)}
                ${buildDetailCard("Occupied Rooms", hostel.occupiedRooms)}
                ${buildDetailCard("Available Rooms", hostel.availableRooms)}
                ${buildDetailCard("Contact Phone", hostel.rawContactPhone, "N/A")}
                ${buildDetailCard("Email", hostel.rawEmail, "N/A")}
                ${buildDetailCard("Established Year", hostel.establishedYear, "N/A")}
                ${buildDetailCard("Address", hostel.rawAddress, "N/A", true)}
            </div>
        </section>

        <section class="details-section">
            <div class="details-section-header">
                <span class="details-section-icon">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21a8 8 0 1 0-16 0"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </span>
                <div>
                    <h4 class="details-section-title">Warden Information</h4>
                    <p class="details-section-copy">Assigned warden profile linked to this hostel.</p>
                </div>
            </div>

            <div class="details-info-grid">
                <article class="detail-item">
                    <p class="detail-label">Warden Name</p>
                    <p class="detail-value">${safeWarden}</p>
                </article>
                <article class="detail-item">
                    <p class="detail-label">Warden Phone</p>
                    <p class="detail-value">${safeWardenPhone}</p>
                </article>
                <article class="detail-item">
                    <p class="detail-label">Warden Email</p>
                    <p class="detail-value">${safeWardenEmail}</p>
                </article>
            </div>
        </section>

        <section class="details-section">
            <div class="details-section-header">
                <span class="details-section-icon">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v18h18"></path><path d="M7 14 10 11l3 3 5-7"></path></svg>
                </span>
                <div>
                    <h4 class="details-section-title">Operational Snapshot</h4>
                    <p class="details-section-copy">Quick reading of room availability and occupancy utilization.</p>
                </div>
            </div>

            <div class="details-info-grid">
                ${buildDetailCard("Occupancy Percentage", `${occupancyPercentage}%`)}
                ${buildDetailCard("Room Utilization", `${hostel.occupiedRooms} occupied / ${hostel.availableRooms} available`)}
                ${buildDetailCard("Location Summary", `${formatDetailValue(hostel.name, "Hostel")} - ${formatDetailValue(hostel.rawCity, "N/A")}`, "N/A", true)}
                ${buildDetailCard("Address Reference", hostel.rawAddress, "N/A", true)}
            </div>
        </section>
    `;
}

function normalizeWarden(warden) {
    return {
        id: Number(warden.warden_id),
        name: warden.warden_name || "Unnamed Warden",
        phone: warden.phone || "Not Available",
        assignedHostelId: warden.assigned_hostel_id ? Number(warden.assigned_hostel_id) : null,
        assignedHostelName: warden.assigned_hostel_name || ""
    };
}

function updateSummary(rows = filteredHostels) {
    const totals = rows.reduce((acc, hostel) => {
        acc.rooms += hostel.totalRooms;
        acc.occupied += hostel.occupiedRooms;
        acc.available += hostel.availableRooms;
        return acc;
    }, { rooms: 0, occupied: 0, available: 0 });

    animateCounter(totalHostelsEl, rows.length);
    animateCounter(availableRoomsEl, totals.available);
    animateCounter(totalRoomsEl, totals.rooms);
    animateCounter(occupiedRoomsEl, totals.occupied);
}

function populateHostelFilter() {
    hostelFilter.innerHTML = [`<option value="">All Hostels</option>`]
        .concat(hostels.map((hostel) => `<option value="${hostel.id}">${hostel.name}</option>`))
        .join("");

    if (selectedHostelId && !hostels.some((hostel) => String(hostel.id) === String(selectedHostelId))) {
        selectedHostelId = "";
    }

    hostelFilter.value = selectedHostelId;
}

function getSelectableWardens(currentHostelId = null) {
    return wardens.filter((warden) => (
        warden.assignedHostelId === null || warden.assignedHostelId === Number(currentHostelId)
    ));
}

function populateWardenOptions(currentHostelId = editId) {
    const allowedWardenIds = new Set(getSelectableWardens(currentHostelId).map((warden) => warden.id));
    const selectedValue = wardenSelect.value;

    const options = [
        `<option value="">Select Warden</option>`,
        `<option value="null">No Warden Assigned</option>`
    ].concat(wardens.map((warden) => {
        const disabled = !allowedWardenIds.has(warden.id);
        const assignment = disabled && warden.assignedHostelName
            ? ` (${warden.assignedHostelName})`
            : "";

        return `
            <option value="${warden.id}" ${disabled ? "disabled" : ""}>
                ${warden.name} - ${warden.phone}${assignment}
            </option>
        `;
    }));

    wardenSelect.innerHTML = options.join("");
    if (selectedValue && [...wardenSelect.options].some((option) => option.value === selectedValue && !option.disabled)) {
        wardenSelect.value = selectedValue;
        return;
    }

    wardenSelect.value = "null";
}

function renderGridState(title, description) {
    hostelGrid.innerHTML = `
        <article class="summary-card p-6 md:col-span-2 xl:col-span-3">
            <h3 class="text-lg font-semibold text-white">${title}</h3>
            <p class="mt-2 text-sm text-slate-300">${description}</p>
        </article>
    `;
}

async function request(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const validationMessage = Array.isArray(payload.errors) && payload.errors.length
            ? payload.errors.map((error) => error.message).join(" ")
            : null;
        throw new Error(validationMessage || payload.message || "Request failed.");
    }

    return payload;
}

async function fetchHostels() {
    const payload = await request(API.hostels);
    return Array.isArray(payload.data) ? payload.data.map(normalizeHostel) : [];
}

async function fetchWardens() {
    const payload = await request(API.wardens);
    return Array.isArray(payload.data) ? payload.data.map(normalizeWarden) : [];
}

async function fetchHostelDetails(hostelId) {
    const payload = await request(`${API.hostels}/${hostelId}`);
    return payload.data ? normalizeHostel(payload.data) : null;
}

function validateHostelForm() {
    const values = {
        hostel_name: hostelNameInput.value.trim(),
        city: hostelCityInput.value.trim(),
        address: hostelAddressInput.value.trim(),
        total_rooms: Number(hostelRoomsInput.value),
        contact_phone: contactPhoneInput.value.trim(),
        email: hostelEmailInput.value.trim(),
        established_yr: establishedYearInput.value.trim(),
        warden_id: wardenSelect.value
    };

    const errors = {};

    if (!values.hostel_name) {
        errors.hostel_name = "Hostel name is required.";
    } else if (values.hostel_name.length < HOSTEL_NAME_MIN_LENGTH || values.hostel_name.length > HOSTEL_NAME_MAX_LENGTH) {
        errors.hostel_name = `Hostel name must be ${HOSTEL_NAME_MIN_LENGTH}-${HOSTEL_NAME_MAX_LENGTH} characters.`;
    }

    if (!values.city) {
        errors.city = "City is required.";
    } else if (values.city.length > CITY_MAX_LENGTH) {
        errors.city = `City must be at most ${CITY_MAX_LENGTH} characters.`;
    }

    if (!values.address) {
        errors.address = "Address is required.";
    }

    if (!Number.isInteger(values.total_rooms) || values.total_rooms <= 0) {
        errors.total_rooms = "Total rooms must be a whole number greater than zero.";
    }

    if (!values.contact_phone) {
        errors.contact_phone = "Contact phone is required.";
    } else if (!PHONE_REGEX.test(values.contact_phone)) {
        errors.contact_phone = "Enter a valid contact phone number.";
    }

    if (!values.email) {
        errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = "Enter a valid email address.";
    }

    if (values.established_yr) {
        const year = Number(values.established_yr);
        if (!Number.isInteger(year) || year < 1901 || year > 2155) {
            errors.established_yr = "Established year must be between 1901 and 2155.";
        }
    }

    if (values.warden_id && values.warden_id !== "null") {
        const selectedWarden = wardens.find((warden) => String(warden.id) === values.warden_id);
        const isUnavailable = selectedWarden && selectedWarden.assignedHostelId !== null && selectedWarden.assignedHostelId !== Number(editId);
        if (!selectedWarden) {
            errors.warden_id = "Select a valid warden.";
        } else if (isUnavailable) {
            errors.warden_id = "This warden is already assigned to another hostel.";
        }
    }

    return errors;
}

function applyValidationErrors(errors) {
    clearFieldErrors();
    Object.entries(errors).forEach(([field, message]) => {
        setFieldError(field, message);
    });
}

function buildHostelPayload() {
    const wardenValue = wardenSelect.value;

    return {
        hostel_name: hostelNameInput.value.trim(),
        address: hostelAddressInput.value.trim(),
        city: hostelCityInput.value.trim(),
        total_rooms: Number(hostelRoomsInput.value),
        contact_phone: contactPhoneInput.value.trim(),
        email: hostelEmailInput.value.trim(),
        established_yr: establishedYearInput.value.trim() ? Number(establishedYearInput.value) : null,
        warden_id: wardenValue && wardenValue !== "null" ? Number(wardenValue) : null
    };
}

function setSubmitState(loading) {
    isSubmitting = loading;
    submitButton.disabled = loading;
    submitButton.textContent = loading ? "Saving..." : "Save";
}

function setDeleteState(loading) {
    isDeleting = loading;
    confirmDeleteButton.disabled = loading;
    confirmDeleteButton.textContent = loading ? "Deleting..." : "Delete";
}

function upsertHostel(hostel) {
    const index = hostels.findIndex((item) => item.id === hostel.id);

    if (index === -1) {
        hostels = [hostel, ...hostels];
        return;
    }

    hostels = hostels.map((item) => (item.id === hostel.id ? hostel : item));
}

async function loadPageData() {
    renderGridState("Loading hostels...", "Fetching live hostel and warden data from the backend API.");

    try {
        const [hostelRows, wardenRows] = await Promise.all([fetchHostels(), fetchWardens()]);
        hostels = hostelRows;
        wardens = wardenRows;
        filteredHostels = [];
        populateHostelFilter();
        populateWardenOptions();

        if (!hostels.length) {
            selectedHostelId = "";
            updateSummary([]);
            renderGridState("No hostels found", "The backend returned no hostel records.");
            return;
        }

        applyHostelFilter();
    } catch (error) {
        hostels = [];
        wardens = [];
        filteredHostels = [];
        selectedHostelId = "";
        populateHostelFilter();
        populateWardenOptions();
        updateSummary([]);
        renderGridState("Unable to load hostels", error.message);
    }
}

function renderHostels(rows = filteredHostels) {
    hostelGrid.innerHTML = "";

    if (!rows.length) {
        renderGridState("No hostel selected", "Choose another hostel from the dropdown to view its card.");
        return;
    }

    rows.forEach((hostel) => {
        const card = document.createElement("article");
        card.className = "hostel-card";
        card.innerHTML = `
            <div class="mb-5 flex items-start justify-between gap-4">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/75">${hostel.city}</p>
                    <h3 class="mt-2 text-2xl font-bold text-white">${hostel.name}</h3>
                </div>
                <span class="metric-chip">${hostel.occupiedRooms}/${hostel.totalRooms}</span>
            </div>

            <div class="space-y-3 text-sm text-slate-300">
                <div class="flex items-center justify-between gap-4">
                    <span>Total Rooms</span>
                    <span class="font-semibold text-white">${hostel.totalRooms}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                    <span>Occupied Rooms</span>
                    <span class="font-semibold text-white">${hostel.occupiedRooms}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                    <span>Available Rooms</span>
                    <span class="font-semibold text-white">${hostel.availableRooms}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                    <span>Warden</span>
                    <span class="font-semibold text-white">${hostel.warden}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                    <span>Contact Phone</span>
                    <span class="font-semibold text-white">${hostel.contactPhone}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                    <span>Warden Phone</span>
                    <span class="font-semibold text-white">${hostel.wardenPhone}</span>
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
}

function applyHostelFilter() {
    filteredHostels = selectedHostelId
        ? hostels.filter((hostel) => String(hostel.id) === String(selectedHostelId))
        : [...hostels];

    updateSummary(filteredHostels);
    renderHostels(filteredHostels);
}

function resetForm() {
    hostelForm.reset();
    editId = null;
    clearFieldErrors();
    setFormError("");
    setSubmitState(false);
    populateWardenOptions(null);
    wardenSelect.value = "null";
}

function openFormModal(mode, hostel = null) {
    resetForm();
    modalTitle.textContent = mode === "edit" ? "Edit Hostel" : "Add Hostel";

    if (mode === "edit" && hostel) {
        editId = hostel.id;
        hostelNameInput.value = hostel.name;
        hostelCityInput.value = hostel.rawCity;
        hostelAddressInput.value = hostel.rawAddress;
        hostelRoomsInput.value = hostel.totalRooms;
        contactPhoneInput.value = hostel.rawContactPhone;
        hostelEmailInput.value = hostel.rawEmail;
        establishedYearInput.value = hostel.establishedYear || "";
        populateWardenOptions(hostel.id);
        wardenSelect.value = hostel.wardenId ? String(hostel.wardenId) : "null";
    } else {
        populateWardenOptions(null);
    }

    hostelModal.classList.remove("hidden");
}

function closeFormModal() {
    hostelModal.classList.add("hidden");
    resetForm();
}

async function openDetailsModal(hostel) {
    const requestId = ++detailsRequestId;
    renderDetailsLoadingState(hostel.name);
    detailsModal.classList.remove("hidden");

    try {
        const liveHostel = await fetchHostelDetails(hostel.id);

        if (requestId !== detailsRequestId || !liveHostel) {
            return;
        }

        renderDetailsContent(liveHostel);
    } catch (error) {
        if (requestId !== detailsRequestId) {
            return;
        }

        renderDetailsErrorState(error.message || "Failed to load hostel details.");
    }
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
    setDeleteState(false);
}

hostelForm.addEventListener("submit", (event) => {
    void (async () => {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        const errors = validateHostelForm();
        applyValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            setFormError("Correct the highlighted fields before saving.");
            return;
        }

        setSubmitState(true);
        setFormError("");

        try {
            const payload = buildHostelPayload();

            if (editId) {
                const response = await request(`${API.hostels}/${editId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });
                if (response.data) {
                    upsertHostel(normalizeHostel(response.data));
                    populateHostelFilter();
                    applyHostelFilter();
                }
                showPageMessage("Hostel updated successfully.");
            } else {
                const response = await request(API.hostels, {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
                if (response.data) {
                    upsertHostel(normalizeHostel(response.data));
                    populateHostelFilter();
                    applyHostelFilter();
                }
                showPageMessage("Hostel added successfully.");
            }

            closeFormModal();
            await loadPageData();
        } catch (submitError) {
            setFormError(submitError.message);
        } finally {
            setSubmitState(false);
        }
    })();
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
        void openDetailsModal(hostel);
    }

    if (action === "edit") {
        openFormModal("edit", hostel);
    }

    if (action === "delete") {
        openConfirmModal(hostel);
    }
});

hostelFilter.addEventListener("change", (event) => {
    selectedHostelId = event.target.value;
    applyHostelFilter();
});

wardenSelect.addEventListener("change", () => {
    setFieldError("warden_id", "");
    setFormError("");
});

confirmDeleteButton.addEventListener("click", () => {
    void (async () => {
        if (deleteId === null || isDeleting) {
            return;
        }

        setDeleteState(true);

        try {
            await request(`${API.hostels}/${deleteId}`, {
                method: "DELETE"
            });

            closeConfirmModal();
            showPageMessage("Hostel deleted successfully.");
            await loadPageData();
        } catch (deleteError) {
            closeConfirmModal();
            showPageMessage(deleteError.message || "Failed to delete hostel.", "error");
        } finally {
            setDeleteState(false);
        }
    })();
});

openAddHostelButton.addEventListener("click", () => {
    openFormModal("add");
});

mobileMenuButton.addEventListener("click", toggleSidebar);
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

[
    ["hostel_name", hostelNameInput],
    ["city", hostelCityInput],
    ["address", hostelAddressInput],
    ["total_rooms", hostelRoomsInput],
    ["contact_phone", contactPhoneInput],
    ["email", hostelEmailInput],
    ["established_yr", establishedYearInput]
].forEach(([field, input]) => {
    input.addEventListener("input", () => {
        setFieldError(field, "");
        setFormError("");
    });
});

handleResize();
void loadPageData();
