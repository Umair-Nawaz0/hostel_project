const API = {
    hostels: "http://localhost:5000/api/hostels",
    students: "http://localhost:5000/api/students",
    rooms: "http://localhost:5000/api/rooms",
    allocations: "http://localhost:5000/api/allocations",
    allocationMeta: "http://localhost:5000/api/allocations/meta"
};

const body = document.body;
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");
const hostelFilter = document.getElementById("hostelFilter");
const allocationSearchInput = document.getElementById("allocationSearch");
const allocationTable = document.getElementById("allocationTable");
const allocationCards = document.getElementById("allocationCards");
const totalAllocationsEl = document.getElementById("totalAllocations");
const activeAllocationsEl = document.getElementById("activeAllocations");
const vacatedAllocationsEl = document.getElementById("vacatedAllocations");
const availableRoomsEl = document.getElementById("availableRooms");
const selectedHostelLabelEl = document.getElementById("selectedHostelLabel");
const searchQueryLabelEl = document.getElementById("searchQueryLabel");
const pageMessage = document.getElementById("pageMessage");

const openAllocationModalButton = document.getElementById("openAllocationModal");
const allocationModal = document.getElementById("allocationModal");
const allocationForm = document.getElementById("allocationForm");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");
const studentSelect = document.getElementById("studentSelect");
const roomSelect = document.getElementById("roomSelect");
const bedSelect = document.getElementById("bedSelect");
const allocatedDateInput = document.getElementById("allocatedDate");
const allocationStatusInput = document.getElementById("allocationStatus");
const vacatedDateField = document.getElementById("vacatedDateField");
const vacatedDateInput = document.getElementById("vacatedDate");
const allocationPreview = document.getElementById("allocationPreview");

const detailsModal = document.getElementById("detailsModal");
const detailsTitle = document.getElementById("detailsTitle");
const detailsContent = document.getElementById("detailsContent");

const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmText = document.getElementById("confirmText");
const confirmActionButton = document.getElementById("confirmAction");

const fieldMap = {
    student_id: { input: studentSelect, error: document.getElementById("studentSelectError") },
    room_id: { input: roomSelect, error: document.getElementById("roomSelectError") },
    bed_id: { input: bedSelect, error: document.getElementById("bedSelectError") },
    allocated_date: { input: allocatedDateInput, error: document.getElementById("allocatedDateError") },
    status: { input: allocationStatusInput, error: document.getElementById("allocationStatusError") },
    vacated_date: { input: vacatedDateInput, error: document.getElementById("vacatedDateError") }
};

let hostels = [];
let students = [];
let rooms = [];
let allocations = [];
let filteredAllocations = [];
let allocationMeta = { bedIds: [] };
let selectedHostelId = "";
let allocationSearchTerm = "";
let editId = null;
let confirmationState = null;
let loadRequestId = 0;
let messageTimeoutId = null;

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

const buildUrl = (baseUrl, params = {}) => {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, String(value));
        }
    });
    return url.toString();
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

const normalizeSearchTerm = (value) => typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").toLowerCase()
    : "";

const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDate = (value, fallback = "Not Available") => {
    if (!value) {
        return fallback;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return fallback;
    }

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    }).format(date);
};

const getToday = () => new Date().toISOString().slice(0, 10);

const showPageMessage = (message, type = "success") => {
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
    messageTimeoutId = window.setTimeout(() => pageMessage.classList.add("hidden"), 4000);
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

const getHostelName = (hostelId) => hostels.find((hostel) => hostel.id === Number(hostelId))?.name || "All Hostels";
const getStudentById = (studentId) => students.find((student) => student.id === Number(studentId)) || null;
const getRoomById = (roomId) => rooms.find((room) => room.id === Number(roomId)) || null;
const getAllocationById = (allocationId) => allocations.find((allocation) => allocation.id === Number(allocationId)) || null;

const normalizeHostel = (row) => ({
    id: Number(row.hostel_id || row.id),
    name: safeText(row.hostel_name || row.name, "Unnamed Hostel")
});

const normalizeStudent = (row) => ({
    id: Number(row.student_id || row.id),
    name: safeText(row.full_name || row.name, "Unnamed Student"),
    rollNumber: safeText(row.roll_number || row.rollNumber, "N/A"),
    hostelId: row.hostel_id ? Number(row.hostel_id) : null,
    hostel: safeText(row.hostel_name || row.hostel, "Unassigned Hostel"),
    roomId: row.room_id ? Number(row.room_id) : null,
    roomName: safeText(row.room_number || row.roomName, "Not Assigned"),
    status: safeText(row.status, "Unknown")
});

const normalizeRoom = (row) => ({
    id: Number(row.room_id || row.id),
    hostelId: Number(row.hostel_id || row.hostelId),
    hostel: safeText(row.hostel_name || row.hostel, "Unassigned Hostel"),
    roomNumber: safeText(row.room_number || row.roomNumber || "", ""),
    capacity: Number(row.capacity || 0),
    occupiedBeds: Number(row.occupied_beds ?? row.occupiedBeds ?? 0),
    availableBeds: Number(row.available_beds ?? row.availableBeds ?? 0),
    status: safeText(row.status, "Unknown")
});

const normalizeAllocation = (row) => ({
    id: Number(row.student_id || row.studentId || row.id),
    studentId: Number(row.student_id || row.studentId || row.id),
    roomId: Number(row.room_id || row.roomId),
    bedId: String(row.bed_id ?? row.bedId ?? ""),
    hostelId: row.hostel_id ? Number(row.hostel_id) : Number(row.hostelId),
    student: safeText(row.student_name || row.student, "Unknown Student"),
    room: safeText(String(row.room_number || row.room || "Unknown Room"), "Unknown Room"),
    hostel: safeText(row.hostel_name || row.hostel, "Unassigned Hostel"),
    allocatedDate: safeText(row.allocated_date || row.date, ""),
    vacatedDate: row.vacated_date || null,
    status: safeText(row.status, "Unknown")
});

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
    hostelFilter.value = selectedHostelId;
};

const getCandidateStudents = (currentStudentId = null) => students.filter((student) => {
    if (currentStudentId && student.id === Number(currentStudentId)) {
        return true;
    }

    const existingAllocation = allocations.find((allocation) => allocation.studentId === student.id);
    return student.status === "Active" && !existingAllocation;
});

const getUsedBedsForRoom = (roomId, currentStudentId = null) => new Set(
    allocations
        .filter((allocation) => allocation.roomId === Number(roomId) && allocation.status === "Active" && allocation.studentId !== Number(currentStudentId))
        .map((allocation) => allocation.bedId)
);

const getAvailableRooms = (currentRoomId = null) => rooms.filter((room) => {
    const matchesHostel = !selectedHostelId || room.hostelId === Number(selectedHostelId);
    if (!matchesHostel) {
        return false;
    }

    if (currentRoomId && room.id === Number(currentRoomId)) {
        return true;
    }

    return room.availableBeds > 0 && room.status.toLowerCase() !== "under maintenance";
});

const populateStudentOptions = (currentStudentId = null) => {
    const selectedValue = currentStudentId ? String(currentStudentId) : studentSelect.value;
    const options = [`<option value="">Select Student</option>`]
        .concat(getCandidateStudents(currentStudentId).map((student) => {
            const context = `${student.rollNumber} • ${student.hostel}`;
            return `<option value="${student.id}">${escapeHtml(student.name)} (${escapeHtml(context)})</option>`;
        }))
        .join("");
    studentSelect.innerHTML = options;
    studentSelect.value = getStudentById(selectedValue) ? selectedValue : "";
};

const populateRoomOptions = (currentRoomId = null) => {
    const selectedValue = currentRoomId ? String(currentRoomId) : roomSelect.value;
    const options = [`<option value="">Select Room</option>`]
        .concat(getAvailableRooms(currentRoomId).map((room) => {
            const context = `${room.hostel} • ${room.availableBeds}/${room.capacity} beds free`;
            return `<option value="${room.id}">${escapeHtml(String(room.roomNumber))} (${escapeHtml(context)})</option>`;
        }))
        .join("");
    roomSelect.innerHTML = options;
    roomSelect.value = getRoomById(selectedValue) ? selectedValue : "";
};

const populateBedOptions = (currentBedId = "", currentStudentId = null) => {
    const roomId = roomSelect.value;
    const usedBeds = roomId ? getUsedBedsForRoom(roomId, currentStudentId) : new Set();
    const currentRoom = roomId ? getRoomById(roomId) : null;
    const capacity = currentRoom ? currentRoom.capacity : 0;
    const selectedValue = currentBedId || bedSelect.value;

    const options = [`<option value="">Select Bed</option>`]
        .concat(allocationMeta.bedIds.map((bedId) => {
            const exceedsCapacity = capacity > 0 && Number(bedId) > capacity;
            const inUse = usedBeds.has(bedId);
            const disabled = exceedsCapacity || inUse;
            const suffix = exceedsCapacity ? " (Exceeds Capacity)" : (inUse ? " (In Use)" : "");
            return `<option value="${bedId}" ${disabled ? "disabled" : ""}>Bed ${bedId}${suffix}</option>`;
        }))
        .join("");

    bedSelect.innerHTML = options;
    if ([...bedSelect.options].some((option) => option.value === selectedValue && !option.disabled)) {
        bedSelect.value = selectedValue;
    } else {
        bedSelect.value = "";
    }
};

const applyFilters = () => {
    const query = normalizeSearchTerm(allocationSearchTerm);

    filteredAllocations = allocations.filter((allocation) => {
        const matchesHostel = !selectedHostelId || allocation.hostelId === Number(selectedHostelId);
        const matchesQuery = !query || [
            allocation.student,
            allocation.room,
            allocation.hostel,
            allocation.status,
            `bed ${allocation.bedId}`
        ].some((value) => normalizeSearchTerm(String(value)).includes(query));

        return matchesHostel && matchesQuery;
    });
};

const updateSummary = () => {
    const availableRoomCount = rooms.filter((room) => {
        const matchesHostel = !selectedHostelId || room.hostelId === Number(selectedHostelId);
        return matchesHostel && room.availableBeds > 0 && room.status.toLowerCase() !== "under maintenance";
    }).length;

    animateCounter(totalAllocationsEl, filteredAllocations.length);
    animateCounter(activeAllocationsEl, filteredAllocations.filter((allocation) => allocation.status === "Active").length);
    animateCounter(vacatedAllocationsEl, filteredAllocations.filter((allocation) => allocation.status === "Vacated").length);
    animateCounter(availableRoomsEl, availableRoomCount);
    selectedHostelLabelEl.textContent = selectedHostelId ? getHostelName(selectedHostelId) : "All Hostels";
    searchQueryLabelEl.textContent = allocationSearchTerm ? allocationSearchTerm : "All Records";
};

const renderEmptyState = (message) => {
    allocationTable.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-slate-400">${escapeHtml(message)}</td></tr>`;
    allocationCards.innerHTML = `<article class="mobile-card empty-state">${escapeHtml(message)}</article>`;
    updateSummary();
};

const buildStatusBadge = (status) => `<span class="status-badge status-${status.toLowerCase().replace(/\s+/g, "-")}">${escapeHtml(status)}</span>`;

const buildActionButtons = (allocation) => {
    const vacateButton = allocation.status === "Active"
        ? `<button type="button" class="ghost-action ghost-action-danger" data-action="vacate" data-id="${allocation.id}">Vacate</button>`
        : "";

    return `
        <button type="button" class="ghost-action" data-action="view" data-id="${allocation.id}">View</button>
        <button type="button" class="ghost-action" data-action="edit" data-id="${allocation.id}">Edit</button>
        ${vacateButton}
        <button type="button" class="ghost-action ghost-action-danger" data-action="delete" data-id="${allocation.id}">Delete</button>
    `;
};

const renderTable = () => {
    allocationTable.innerHTML = "";
    allocationCards.innerHTML = "";
    applyFilters();

    if (!filteredAllocations.length) {
        const emptyMessage = selectedHostelId || allocationSearchTerm
            ? "No allocations match the current hostel filter and search."
            : "No allocations found.";
        renderEmptyState(emptyMessage);
        return;
    }

    filteredAllocations.forEach((allocation) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div class="record-title">${escapeHtml(allocation.student)}</div>
                <div class="record-subtitle">Bed ${escapeHtml(allocation.bedId)}</div>
            </td>
            <td><div class="record-title">${escapeHtml(allocation.room)}</div></td>
            <td><div class="record-title">${escapeHtml(allocation.hostel)}</div></td>
            <td>${escapeHtml(formatDate(allocation.allocatedDate))}</td>
            <td>${escapeHtml(formatDate(allocation.vacatedDate, "Still Active"))}</td>
            <td>${buildStatusBadge(allocation.status)}</td>
            <td><div class="action-row">${buildActionButtons(allocation)}</div></td>
        `;
        allocationTable.appendChild(row);

        const card = document.createElement("article");
        card.className = "mobile-card";
        card.innerHTML = `
            <div class="flex items-start justify-between gap-4">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/75">${escapeHtml(allocation.hostel)}</p>
                    <h3 class="mt-2 text-xl font-semibold text-white">${escapeHtml(allocation.student)}</h3>
                    <p class="mt-2 text-sm text-slate-300">Room ${escapeHtml(allocation.room)} • Bed ${escapeHtml(allocation.bedId)}</p>
                </div>
                ${buildStatusBadge(allocation.status)}
            </div>
            <div class="info-grid mt-5">
                <div class="info-chip">
                    <p class="info-chip-label">Allocated</p>
                    <p class="info-chip-value">${escapeHtml(formatDate(allocation.allocatedDate))}</p>
                </div>
                <div class="info-chip">
                    <p class="info-chip-label">Vacated</p>
                    <p class="info-chip-value">${escapeHtml(formatDate(allocation.vacatedDate, "Still Active"))}</p>
                </div>
                <div class="info-chip">
                    <p class="info-chip-label">Student ID</p>
                    <p class="info-chip-value">#${allocation.id}</p>
                </div>
                <div class="info-chip">
                    <p class="info-chip-label">Bed</p>
                    <p class="info-chip-value">Bed ${escapeHtml(allocation.bedId)}</p>
                </div>
            </div>
            <div class="action-row mt-5">${buildActionButtons(allocation)}</div>
        `;
        allocationCards.appendChild(card);
    });

    updateSummary();
};

const loadPageData = async () => {
    const requestId = ++loadRequestId;
    renderEmptyState("Loading allocations...");

    try {
        const [hostelsPayload, studentsPayload, roomsPayload, allocationMetaPayload, allocationsPayload] = await Promise.all([
            request(API.hostels),
            request(API.students),
            request(API.rooms),
            request(API.allocationMeta),
            request(API.allocations)
        ]);

        if (requestId !== loadRequestId) {
            return;
        }

        hostels = (hostelsPayload.data || []).map(normalizeHostel);
        students = (studentsPayload.data || []).map(normalizeStudent);
        rooms = (roomsPayload.data || []).map(normalizeRoom);
        allocationMeta = {
            bedIds: Array.isArray(allocationMetaPayload.bedIds)
                ? allocationMetaPayload.bedIds
                : (Array.isArray(allocationMetaPayload.data?.bedIds) ? allocationMetaPayload.data.bedIds : [])
        };
        allocations = (allocationsPayload.data || []).map(normalizeAllocation);
        populateHostelOptions();
        populateStudentOptions(editId);
        populateRoomOptions(getAllocationById(editId)?.roomId || null);
        populateBedOptions(getAllocationById(editId)?.bedId || "", editId);

        if (requestId !== loadRequestId) {
            return;
        }

        renderTable();
    } catch (error) {
        renderEmptyState(error.message);
    }
};

const resetForm = () => {
    allocationForm.reset();
    editId = null;
    allocatedDateInput.value = getToday();
    allocationStatusInput.value = "Active";
    allocationStatusInput.disabled = false;
    vacatedDateInput.value = "";
    vacatedDateField.classList.add("hidden");
    clearFieldErrors();
    setFormError("");
    populateStudentOptions();
    populateRoomOptions();
    populateBedOptions();
    renderPreview();
};

const toggleVacatedField = () => {
    const isVacated = allocationStatusInput.value === "Vacated";
    vacatedDateField.classList.toggle("hidden", !isVacated);
    if (!isVacated) {
        vacatedDateInput.value = "";
        setFieldError("vacated_date", "");
    } else if (!vacatedDateInput.value) {
        vacatedDateInput.value = getToday();
    }
    renderPreview();
};

const renderPreview = () => {
    const student = getStudentById(studentSelect.value);
    const room = getRoomById(roomSelect.value);
    const status = allocationStatusInput.value || "Active";

    allocationPreview.innerHTML = [
        {
            label: "Student",
            value: student ? `${student.name} (${student.rollNumber})` : "No student selected"
        },
        {
            label: "Room",
            value: room ? `${room.roomNumber} • ${room.hostel}` : "No room selected"
        },
        {
            label: "Bed",
            value: bedSelect.value ? `Bed ${bedSelect.value}` : "No bed selected"
        },
        {
            label: "Lifecycle",
            value: status === "Vacated"
                ? `Allocated ${formatDate(allocatedDateInput.value)} • Vacated ${formatDate(vacatedDateInput.value)}`
                : `Allocated ${formatDate(allocatedDateInput.value)} • Active`
        }
    ].map((item) => `
        <article class="preview-card">
            <p class="preview-label">${escapeHtml(item.label)}</p>
            <p class="preview-value">${escapeHtml(item.value)}</p>
        </article>
    `).join("");
};

const openFormModal = (mode, allocation = null) => {
    resetForm();
    modalTitle.textContent = mode === "edit" ? "Edit Allocation" : "Add Allocation";

    if (mode === "edit" && allocation) {
        editId = allocation.id;
        populateStudentOptions(allocation.studentId);
        studentSelect.value = String(allocation.studentId);
        populateRoomOptions(allocation.roomId);
        roomSelect.value = String(allocation.roomId);
        populateBedOptions(allocation.bedId, allocation.studentId);
        bedSelect.value = allocation.bedId;
        allocatedDateInput.value = allocation.allocatedDate ? String(allocation.allocatedDate).slice(0, 10) : getToday();
        allocationStatusInput.value = allocation.status;
        vacatedDateInput.value = allocation.vacatedDate ? String(allocation.vacatedDate).slice(0, 10) : "";

        if (allocation.status === "Vacated") {
            allocationStatusInput.disabled = true;
            vacatedDateField.classList.remove("hidden");
        } else {
            toggleVacatedField();
        }
    }

    renderPreview();
    allocationModal.classList.remove("hidden");
};

const closeFormModal = () => {
    allocationModal.classList.add("hidden");
    resetForm();
};

const buildDetailCard = (label, value, fallback = "N/A", wide = false) => `
    <article class="detail-item ${wide ? "detail-wide" : ""}">
        <p class="detail-label">${escapeHtml(label)}</p>
        <p class="detail-value">${escapeHtml(value || fallback)}</p>
    </article>
`;

const buildStatCard = (label, value, note, icon) => `
    <article class="details-stat-card">
        <p class="details-stat-label">${icon}<span>${escapeHtml(label)}</span></p>
        <p class="details-stat-value">${escapeHtml(value)}</p>
        ${note ? `<p class="details-stat-note">${escapeHtml(note)}</p>` : ""}
    </article>
`;

const openDetailsModal = (allocation) => {
    const room = getRoomById(allocation.roomId);
    const student = getStudentById(allocation.studentId);
    const availableBedsLabel = room ? `${room.availableBeds}/${room.capacity} beds free` : "N/A";

    detailsTitle.textContent = `${allocation.student} Allocation`;
    detailsContent.innerHTML = `
        <section class="details-hero">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h3 class="text-3xl font-semibold text-white">${escapeHtml(allocation.student)}</h3>
                </div>
                <div class="details-pill-row">
                    <span class="details-pill">Student ID: ${escapeHtml(String(allocation.id))}</span>
                    <span class="details-pill">Status: ${escapeHtml(allocation.status)}</span>
                </div>
            </div>

            <div class="details-stat-grid">
                ${buildStatCard("Allocated Date", formatDate(allocation.allocatedDate), "", "")}
                ${buildStatCard("Vacated Date", formatDate(allocation.vacatedDate, "Still Active"), "", "")}
                ${buildStatCard("Room Availability", availableBedsLabel, "", "")}
                ${buildStatCard("Bed", `Bed ${allocation.bedId}`, "", "")}
            </div>
        </section>

        <section class="details-section">
            <div class="details-info-grid">
                ${buildDetailCard("Student Name", allocation.student)}
                ${buildDetailCard("Roll Number", student?.rollNumber || "N/A")}
                ${buildDetailCard("Room Number", allocation.room)}
                ${buildDetailCard("Hostel", allocation.hostel)}
                ${buildDetailCard("Bed", `Bed ${allocation.bedId}`)}
                ${buildDetailCard("Allocated Date", formatDate(allocation.allocatedDate))}
                ${buildDetailCard("Vacated Date", formatDate(allocation.vacatedDate, "Still Active"))}
                ${buildDetailCard("Allocation Status", allocation.status)}
                ${buildDetailCard("Room Occupancy", room ? `${room.occupiedBeds}/${room.capacity} beds occupied` : "N/A")}
                ${buildDetailCard("Student Current Room", student?.roomName || "N/A")}
            </div>
        </section>
    `;
    detailsModal.classList.remove("hidden");
};

const closeDetailsModal = () => detailsModal.classList.add("hidden");

const openConfirmModal = ({ type, allocation, title, message, buttonLabel }) => {
    confirmationState = { type, allocationId: allocation.id };
    confirmTitle.textContent = title;
    confirmText.textContent = message;
    confirmActionButton.textContent = buttonLabel;
    confirmModal.classList.remove("hidden");
};

const closeConfirmModal = () => {
    confirmationState = null;
    confirmModal.classList.add("hidden");
};

const validateForm = () => {
    const values = {
        student_id: studentSelect.value,
        room_id: roomSelect.value,
        bed_id: bedSelect.value,
        allocated_date: allocatedDateInput.value,
        status: allocationStatusInput.value,
        vacated_date: vacatedDateInput.value
    };

    const errors = {};
    const room = getRoomById(values.room_id);
    const usedBeds = values.room_id ? getUsedBedsForRoom(values.room_id, editId) : new Set();

    if (!values.student_id) {
        errors.student_id = "Select a student.";
    }

    if (!values.room_id) {
        errors.room_id = "Select a room.";
    }

    if (!values.bed_id) {
        errors.bed_id = "Select a bed.";
    } else if (!allocationMeta.bedIds.includes(values.bed_id)) {
        errors.bed_id = "Select a valid bed.";
    } else if (room && Number(values.bed_id) > room.capacity) {
        errors.bed_id = `Selected bed exceeds room capacity (${room.capacity}).`;
    } else if (usedBeds.has(values.bed_id)) {
        errors.bed_id = "This bed is already assigned in the selected room.";
    }

    if (!values.allocated_date) {
        errors.allocated_date = "Allocated date is required.";
    }

    if (!["Active", "Vacated"].includes(values.status)) {
        errors.status = "Select a valid status.";
    }

    if (!allocationMeta.bedIds.length) {
        errors.bed_id = "Bed options could not be loaded from the database schema.";
    }

    if (values.status === "Vacated") {
        if (!values.vacated_date) {
            errors.vacated_date = "Vacated date is required when vacating an allocation.";
        } else if (new Date(values.vacated_date) < new Date(values.allocated_date)) {
            errors.vacated_date = "Vacated date cannot be earlier than the allocated date.";
        }
    }

    Object.entries(errors).forEach(([field, message]) => setFieldError(field, message));
    return { values, errors };
};

const buildPayload = (values) => {
    const payload = {
        student_id: Number(values.student_id),
        room_id: Number(values.room_id),
        bed_id: values.bed_id,
        allocated_date: values.allocated_date
    };

    if (values.status === "Vacated") {
        payload.status = "Vacated";
        payload.vacated_date = values.vacated_date || getToday();
    } else {
        payload.status = "Active";
        payload.vacated_date = null;
    }

    return payload;
};

const handleTableAction = async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const allocation = getAllocationById(button.dataset.id);
    if (!allocation) {
        return;
    }

    if (action === "view") {
        openDetailsModal(allocation);
        return;
    }

    if (action === "edit") {
        openFormModal("edit", allocation);
        return;
    }

    if (action === "vacate") {
        openConfirmModal({
            type: "vacate",
            allocation,
            title: "Vacate Allocation",
            message: `This will mark ${allocation.student}'s allocation in room ${allocation.room}, bed ${allocation.bedId}, as vacated.`,
            buttonLabel: "Vacate"
        });
        return;
    }

    if (action === "delete") {
        openConfirmModal({
            type: "delete",
            allocation,
            title: "Delete Allocation",
            message: `This will permanently remove ${allocation.student}'s allocation record.`,
            buttonLabel: "Delete"
        });
    }
};

const submitForm = async (event) => {
    event.preventDefault();
    clearFieldErrors();
    setFormError("");

    const { values, errors } = validateForm();
    if (Object.keys(errors).length) {
        setFormError("Fix the highlighted fields and try again.");
        return;
    }

    try {
        const payload = buildPayload(values);
        const isEdit = Boolean(editId);
        const url = isEdit ? `${API.allocations}/${editId}` : API.allocations;
        const method = isEdit ? "PUT" : "POST";

        await request(url, {
            method,
            body: JSON.stringify(payload)
        });

        closeFormModal();
        showPageMessage(isEdit ? "Allocation updated successfully." : "Allocation created successfully.");
        await loadPageData();
    } catch (error) {
        applyApiErrors(error);
        setFormError(error.message);
    }
};

const handleConfirmation = async () => {
    if (!confirmationState) {
        return;
    }

    const allocation = getAllocationById(confirmationState.allocationId);
    if (!allocation) {
        closeConfirmModal();
        return;
    }

    try {
        if (confirmationState.type === "vacate") {
            await request(`${API.allocations}/${allocation.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    student_id: allocation.studentId,
                    room_id: allocation.roomId,
                    bed_id: allocation.bedId,
                    allocated_date: allocation.allocatedDate,
                    status: "Vacated",
                    vacated_date: getToday()
                })
            });
            showPageMessage("Allocation vacated successfully.");
        }

        if (confirmationState.type === "delete") {
            await request(`${API.allocations}/${allocation.id}`, { method: "DELETE" });
            showPageMessage("Allocation deleted successfully.");
        }

        closeConfirmModal();
        await loadPageData();
    } catch (error) {
        closeConfirmModal();
        showPageMessage(error.message, "error");
    }
};

const handleHostelFilterChange = async (event) => {
    selectedHostelId = event.target.value;
    populateRoomOptions(getAllocationById(editId)?.roomId || null);
    populateBedOptions(getAllocationById(editId)?.bedId || "", editId);
    await loadPageData();
};

const initializeEventListeners = () => {
    mobileMenuButton?.addEventListener("click", toggleSidebar);
    mobileOverlay?.addEventListener("click", closeMobileSidebar);
    window.addEventListener("resize", handleResize);

    openAllocationModalButton.addEventListener("click", () => openFormModal("create"));
    document.querySelectorAll("[data-close-allocation-modal]").forEach((button) => button.addEventListener("click", closeFormModal));
    document.querySelector("[data-close-details]")?.addEventListener("click", closeDetailsModal);
    document.querySelectorAll("[data-close-confirm]").forEach((button) => button.addEventListener("click", closeConfirmModal));

    hostelFilter.addEventListener("change", handleHostelFilterChange);
    allocationSearchInput.addEventListener("input", (event) => {
        allocationSearchTerm = event.target.value.trim();
        renderTable();
    });

    allocationForm.addEventListener("submit", submitForm);
    allocationStatusInput.addEventListener("change", toggleVacatedField);
    studentSelect.addEventListener("change", renderPreview);
    roomSelect.addEventListener("change", () => {
        populateBedOptions("", editId);
        renderPreview();
    });
    bedSelect.addEventListener("change", renderPreview);
    allocatedDateInput.addEventListener("change", renderPreview);
    vacatedDateInput.addEventListener("change", renderPreview);
    confirmActionButton.addEventListener("click", handleConfirmation);

    allocationTable.addEventListener("click", handleTableAction);
    allocationCards.addEventListener("click", handleTableAction);
};

const initializePage = async () => {
    initializeEventListeners();
    resetForm();
    await loadPageData();
};

void initializePage();
