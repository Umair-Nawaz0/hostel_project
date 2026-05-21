const API = {
    hostels: "http://localhost:5000/api/hostels",
    staff: "http://localhost:5000/api/staff",
    wardens: "http://localhost:5000/api/wardens"
};

const body = document.body;
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");
const hostelFilter = document.getElementById("hostelFilter");
const staffSearchInput = document.getElementById("staffSearch");
const visibleCountEl = document.getElementById("visibleCount");
const wardenCountEl = document.getElementById("wardenCount");
const staffCountEl = document.getElementById("staffCount");
const payrollTotalEl = document.getElementById("payrollTotal");
const selectedHostelLabelEl = document.getElementById("selectedHostelLabel");
const staffSectionCountEl = document.getElementById("staffSectionCount");
const pageMessage = document.getElementById("pageMessage");
const wardenTable = document.getElementById("wardenTable");
const wardenCards = document.getElementById("wardenCards");
const staffTable = document.getElementById("staffTable");
const staffCards = document.getElementById("staffCards");
const openStaffModalButton = document.getElementById("openStaffModal");
const openWardenModalButton = document.getElementById("openWardenModal");

const memberModal = document.getElementById("memberModal");
const memberForm = document.getElementById("memberForm");
const memberTypeInput = document.getElementById("memberType");
const memberTypeBadge = document.getElementById("memberTypeBadge");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");
const fullNameInput = document.getElementById("fullName");
const roleInput = document.getElementById("role");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const emailLabel = document.getElementById("emailLabel");
const salaryInput = document.getElementById("salary");
const hostelSelect = document.getElementById("hostelSelect");
const cnicInput = document.getElementById("cnic");
const staffOnlyFields = [...document.querySelectorAll(".staff-only")];
const wardenOnlyFields = [...document.querySelectorAll(".warden-only")];

const detailsModal = document.getElementById("detailsModal");
const detailsTitle = document.getElementById("detailsTitle");
const detailsContent = document.getElementById("detailsContent");

const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmText = document.getElementById("confirmText");
const confirmDeleteButton = document.getElementById("confirmDelete");

const fieldMap = {
    full_name: { input: fullNameInput, error: document.getElementById("fullNameError") },
    role: { input: roleInput, error: document.getElementById("roleError") },
    phone: { input: phoneInput, error: document.getElementById("phoneError") },
    email: { input: emailInput, error: document.getElementById("emailError") },
    salary: { input: salaryInput, error: document.getElementById("salaryError") },
    hostel_id: { input: hostelSelect, error: document.getElementById("hostelSelectError") },
    cnic: { input: cnicInput, error: document.getElementById("cnicError") }
};

let hostels = [];
let staffRecords = [];
let wardenRecords = [];
let visibleStaffRecords = [];
let visibleWardenRecords = [];
let selectedHostelId = "";
let searchTerm = "";
let editState = null;
let deleteState = null;
let messageTimeoutId = null;
let loadRequestId = 0;

const request = async (url, options = {}) => {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
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
};

const animateCounter = (element, target) => {
    const numericText = String(element.textContent).replace(/[^\d]/g, "");
    const start = Number(numericText) || 0;
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

const formatCurrency = (value) => `PKR ${Math.round(Number(value) || 0).toLocaleString()}`;

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
    ? value.trim().replace(/\s+/g, " ").toLowerCase()
    : "";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhone = (value) => /^[+0-9()\-\s]{7,20}$/.test(value);
const isValidCnic = (value) => /^\d{5}-?\d{7}-?\d$/.test(value);

const setFormError = (message) => {
    formError.textContent = message;
    formError.classList.toggle("hidden", !message);
};

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

const normalizeHostel = (row) => ({
    id: Number(row.hostel_id ?? row.id),
    name: safeText(row.hostel_name || row.name, "Unnamed Hostel")
});

const normalizeStaffRecord = (row) => ({
    id: Number(row.staff_id ?? row.id),
    entityType: "staff",
    fullName: safeText(row.full_name || row.name, "Unnamed Staff"),
    role: safeText(row.role, "Staff"),
    phone: safeText(row.phone),
    email: row.email ? safeText(row.email) : null,
    salary: Number(row.salary || 0),
    hostelId: Number(row.hostel_id ?? row.hostelId),
    hostelName: safeText(row.hostel_name || row.hostel, "Unassigned Hostel"),
});

const normalizeWardenRecord = (row) => ({
    id: Number(row.warden_id ?? row.id),
    entityType: "warden",
    fullName: safeText(row.full_name || row.warden_name || row.name, "Unnamed Warden"),
    phone: safeText(row.phone),
    email: safeText(row.email),
    hostelId: row.assigned_hostel_id ? Number(row.assigned_hostel_id) : (row.assignedHostelId ? Number(row.assignedHostelId) : null),
    hostelName: safeText(row.assigned_hostel_name || row.assignedHostelName, "Not Assigned"),
    cnic: safeText(row.cnic)
});

const openMobileSidebar = () => {
    body.classList.add("sidebar-open");
    mobileOverlay.classList.add("active");
};

const closeMobileSidebar = () => {
    body.classList.remove("sidebar-open");
    mobileOverlay.classList.remove("active");
};

const handleResize = () => closeMobileSidebar();

const populateHostelOptions = () => {
    hostelFilter.innerHTML = [`<option value="">All Hostels</option>`]
        .concat(hostels.map((hostel) => `<option value="${hostel.id}">${escapeHtml(hostel.name)}</option>`))
        .join("");
    hostelSelect.innerHTML = hostels.map((hostel) => `<option value="${hostel.id}">${escapeHtml(hostel.name)}</option>`).join("");
    hostelFilter.value = selectedHostelId;

    if (!hostelSelect.value && hostels[0]) {
        hostelSelect.value = String(hostels[0].id);
    }
};

const applyFilters = () => {
    const normalizedSearch = normalizeSearchTerm(searchTerm);
    const selectedHostel = selectedHostelId ? Number(selectedHostelId) : null;
    const matchesSearch = (record) => {
        if (!normalizedSearch) {
            return true;
        }

        const haystack = [
            record.fullName,
            record.phone,
            record.email || "",
        ].map((value) => normalizeSearchTerm(String(value)));

        return haystack.some((value) => value.includes(normalizedSearch));
    };

    visibleWardenRecords = wardenRecords.filter((record) => {
        if (selectedHostel && record.hostelId !== selectedHostel) {
            return false;
        }
        return matchesSearch(record);
    });

    visibleStaffRecords = staffRecords.filter((record) => {
        if (selectedHostel && record.hostelId !== selectedHostel) {
            return false;
        }
        return matchesSearch(record);
    });
};

const buildActionButtons = (record) => `
    <button class="action-btn" data-action="view" data-type="${record.entityType}" data-id="${record.id}">View</button>
    <button class="action-btn" data-action="edit" data-type="${record.entityType}" data-id="${record.id}">Edit</button>
    <button class="action-btn" data-action="delete" data-type="${record.entityType}" data-id="${record.id}">Delete</button>
`;

const updateSummary = () => {
    const payroll = visibleStaffRecords.reduce((total, record) => total + Number(record.salary || 0), 0);
    const visibleRecords = visibleWardenRecords.length + visibleStaffRecords.length;

    animateCounter(visibleCountEl, visibleRecords);
    animateCounter(wardenCountEl, visibleWardenRecords.length);
    animateCounter(staffCountEl, visibleStaffRecords.length);
    payrollTotalEl.textContent = formatCurrency(payroll);
    selectedHostelLabelEl.textContent = selectedHostelId
        ? (hostels.find((hostel) => hostel.id === Number(selectedHostelId))?.name || "Unknown Hostel")
        : "All Hostels";
    staffSectionCountEl.textContent = `${visibleStaffRecords.length.toLocaleString()} Record${visibleStaffRecords.length === 1 ? "" : "s"}`;
};

const renderWardenSection = () => {
    wardenTable.innerHTML = "";
    wardenCards.innerHTML = "";

    if (!visibleWardenRecords.length) {
        wardenTable.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-slate-400">${escapeHtml("No wardens match the current filters.")}</td></tr>`;
        wardenCards.innerHTML = `<article class="mobile-card empty-state">${escapeHtml("No wardens match the current filters.")}</article>`;
        return;
    }

    visibleWardenRecords.forEach((record) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div class="record-title">${escapeHtml(record.fullName)}</div>
                <div class="record-subtitle">Warden</div>
            </td>
            <td>${escapeHtml(record.email || "Not Available")}</td>
            <td>${escapeHtml(record.phone)}</td>
            <td>${escapeHtml(record.cnic || "N/A")}</td>
            <td><div class="row-actions justify-end">${buildActionButtons(record)}</div></td>
        `;
        wardenTable.appendChild(row);

        const card = document.createElement("article");
        card.className = "mobile-card";
        card.innerHTML = `
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h3 class="text-xl font-semibold text-white">${escapeHtml(record.fullName)}</h3>
                    <p class="mt-2 text-sm text-slate-300">Warden</p>
                </div>
                <span class="role-badge role-warden">Warden</span>
            </div>
            <div class="info-grid mt-5">
                <div class="info-chip">
                    <p class="info-chip-label">Email</p>
                    <p class="info-chip-value">${escapeHtml(record.email || "Not Available")}</p>
                </div>
                <div class="info-chip">
                    <p class="info-chip-label">Phone</p>
                    <p class="info-chip-value">${escapeHtml(record.phone)}</p>
                </div>
                <div class="info-chip">
                    <p class="info-chip-label">CNIC</p>
                    <p class="info-chip-value">${escapeHtml(record.cnic || "N/A")}</p>
                </div>
            </div>
            <div class="row-actions mt-5">${buildActionButtons(record)}</div>
        `;
        wardenCards.appendChild(card);
    });
};

const renderStaffSection = () => {
    staffTable.innerHTML = "";
    staffCards.innerHTML = "";

    if (!visibleStaffRecords.length) {
        staffTable.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-slate-400">${escapeHtml("No staff records match the current filters.")}</td></tr>`;
        staffCards.innerHTML = `<article class="mobile-card empty-state">${escapeHtml("No staff records match the current filters.")}</article>`;
        return;
    }

    visibleStaffRecords.forEach((record) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div class="record-title">${escapeHtml(record.fullName)}</div>
                <div class="record-subtitle">Staff</div>
            </td>
            <td>${escapeHtml(record.role)}</td>
            <td>${escapeHtml(formatCurrency(record.salary))}</td>
            <td>${escapeHtml(record.hostelName || "Not Assigned")}</td>
            <td>${escapeHtml(record.phone)}</td>
            <td>${escapeHtml(record.email || "Not Available")}</td>
            <td><div class="row-actions justify-end">${buildActionButtons(record)}</div></td>
        `;
        staffTable.appendChild(row);

        const card = document.createElement("article");
        card.className = "mobile-card";
        card.innerHTML = `
            <div class="flex items-start justify-between gap-4">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/75">${escapeHtml(record.hostelName || "Not Assigned")}</p>
                    <h3 class="mt-2 text-xl font-semibold text-white">${escapeHtml(record.fullName)}</h3>
                    <p class="mt-2 text-sm text-slate-300">${escapeHtml(record.role)}</p>
                </div>
                <span class="role-badge role-staff">Staff</span>
            </div>
            <div class="info-grid mt-5">
                <div class="info-chip">
                    <p class="info-chip-label">Role</p>
                    <p class="info-chip-value">${escapeHtml(record.role)}</p>
                </div>
                <div class="info-chip">
                    <p class="info-chip-label">Salary</p>
                    <p class="info-chip-value">${escapeHtml(formatCurrency(record.salary))}</p>
                </div>
                <div class="info-chip">
                    <p class="info-chip-label">Phone</p>
                    <p class="info-chip-value">${escapeHtml(record.phone)}</p>
                </div>
                <div class="info-chip">
                    <p class="info-chip-label">Email</p>
                    <p class="info-chip-value">${escapeHtml(record.email || "Not Available")}</p>
                </div>
            </div>
            <div class="row-actions mt-5">${buildActionButtons(record)}</div>
        `;
        staffCards.appendChild(card);
    });
};

const renderSections = () => {
    applyFilters();
    renderWardenSection();
    renderStaffSection();
    updateSummary();
};

const loadPageData = async () => {
    const requestId = ++loadRequestId;
    visibleWardenRecords = [];
    visibleStaffRecords = [];
    wardenTable.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-slate-400">${escapeHtml("Loading wardens...")}</td></tr>`;
    staffTable.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-slate-400">${escapeHtml("Loading staff records...")}</td></tr>`;
    wardenCards.innerHTML = `<article class="mobile-card empty-state">${escapeHtml("Loading wardens...")}</article>`;
    staffCards.innerHTML = `<article class="mobile-card empty-state">${escapeHtml("Loading staff records...")}</article>`;
    updateSummary();

    try {
        const [hostelPayload, staffPayload, wardenPayload] = await Promise.all([
            request(API.hostels),
            request(API.staff),
            request(API.wardens)
        ]);

        if (requestId !== loadRequestId) {
            return;
        }

        hostels = (hostelPayload.data || []).map(normalizeHostel);
        staffRecords = (staffPayload.data || []).map(normalizeStaffRecord);
        wardenRecords = (wardenPayload.data || []).map(normalizeWardenRecord);
        populateHostelOptions();
        renderSections();
    } catch (error) {
        visibleWardenRecords = [];
        visibleStaffRecords = [];
        wardenTable.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-slate-400">${escapeHtml(error.message)}</td></tr>`;
        staffTable.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-slate-400">${escapeHtml(error.message)}</td></tr>`;
        wardenCards.innerHTML = `<article class="mobile-card empty-state">${escapeHtml(error.message)}</article>`;
        staffCards.innerHTML = `<article class="mobile-card empty-state">${escapeHtml(error.message)}</article>`;
        updateSummary();
    }
};

const resetForm = () => {
    memberForm.reset();
    editState = null;
    memberTypeInput.value = "staff";
    memberTypeBadge.textContent = "Staff";
    memberTypeBadge.className = "entity-badge staff";
    modalTitle.textContent = "Add Staff";
    hostelSelect.value = selectedHostelId || String(hostels[0]?.id || "");
    emailLabel.innerHTML = "Email";
    cnicInput.value = "";
    salaryInput.value = "";
    clearFieldErrors();
    setFormError("");
    setModalType("staff");
};

const setModalType = (type) => {
    const isWarden = type === "warden";
    memberTypeInput.value = type;
    memberTypeBadge.textContent = isWarden ? "Warden" : "Staff";
    memberTypeBadge.className = `entity-badge ${isWarden ? "warden" : "staff"}`;
    emailLabel.innerHTML = isWarden ? `Email <span class="text-rose-300">*</span>` : "Email";

    staffOnlyFields.forEach((field) => field.classList.toggle("hidden", isWarden));
    wardenOnlyFields.forEach((field) => field.classList.toggle("hidden", !isWarden));

    roleInput.required = !isWarden;
    salaryInput.required = !isWarden;
    hostelSelect.required = !isWarden;
    emailInput.required = isWarden;
    cnicInput.required = isWarden;
};

const getRecordByKey = (type, id) => {
    const source = type === "warden" ? wardenRecords : staffRecords;
    return source.find((record) => record.id === Number(id)) || null;
};

const openMemberModal = (type, mode, record = null) => {
    resetForm();
    setModalType(type);
    modalTitle.textContent = `${mode === "edit" ? "Edit" : "Add"} ${type === "warden" ? "Warden" : "Staff"}`;

    if (mode === "edit" && record) {
        editState = { type, id: record.id };
        fullNameInput.value = record.fullName;
        phoneInput.value = record.phone === "Not Available" ? "" : record.phone;
        emailInput.value = record.email || "";

        if (type === "staff") {
            roleInput.value = record.role;
            salaryInput.value = record.salary;
            hostelSelect.value = String(record.hostelId || selectedHostelId || hostels[0]?.id || "");
        } else {
            cnicInput.value = record.cnic || "";
        }
    }

    memberModal.classList.remove("hidden");
};

const closeMemberModal = () => {
    memberModal.classList.add("hidden");
    resetForm();
};

const buildDetailCard = (label, value) => `
    <div class="detail-item">
        <p class="detail-label">${escapeHtml(label)}</p>
        <p class="detail-value">${escapeHtml(value)}</p>
    </div>
`;

const openDetailsModal = (record) => {
    detailsTitle.textContent = record.fullName;
    detailsContent.innerHTML = record.entityType === "warden"
        ? [
            buildDetailCard("Email", record.email || "Not Available"),
            buildDetailCard("Phone", record.phone),
            buildDetailCard("CNIC", record.cnic || "N/A"),
        ].join("")
        : [
            buildDetailCard("Role", record.role),
            buildDetailCard("Salary", formatCurrency(record.salary)),
            buildDetailCard("Hostel", record.hostelName || "Not Assigned"),
            buildDetailCard("Phone", record.phone),
            buildDetailCard("Email", record.email || "Not Available"),
        ].join("");
    detailsModal.classList.remove("hidden");
};

const closeDetailsModal = () => detailsModal.classList.add("hidden");

const openConfirmModal = (record) => {
    deleteState = { type: record.entityType, id: record.id, name: record.fullName };
    confirmTitle.textContent = `Delete ${record.entityType === "warden" ? "Warden" : "Staff"}`;
    confirmText.textContent = `This will permanently remove ${record.fullName}.`;
    confirmModal.classList.remove("hidden");
};

const closeConfirmModal = () => {
    deleteState = null;
    confirmModal.classList.add("hidden");
};

const validateMemberForm = () => {
    const type = memberTypeInput.value;
    const values = {
        full_name: fullNameInput.value.trim(),
        role: roleInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim(),
        salary_raw: salaryInput.value.trim(),
        salary: Number(salaryInput.value),
        hostel_id: hostelSelect.value,
        cnic: cnicInput.value.trim()
    };
    const errors = {};

    if (!values.full_name) {
        errors.full_name = "Full name is required.";
    }

    if (!values.phone) {
        errors.phone = "Phone is required.";
    } else if (!isValidPhone(values.phone)) {
        errors.phone = "Enter a valid phone number.";
    }

    if (type === "staff") {
        if (!values.role) {
            errors.role = "Role is required.";
        }

        if (!values.hostel_id) {
            errors.hostel_id = "Hostel is required.";
        }

        if (!values.salary_raw) {
            errors.salary = "Salary is required.";
        } else if (!Number.isFinite(values.salary) || values.salary < 0) {
            errors.salary = "Salary must be a non-negative number.";
        }

        if (values.email && !isValidEmail(values.email)) {
            errors.email = "Enter a valid email address.";
        }
    } else {
        if (!values.email) {
            errors.email = "Email is required for wardens.";
        } else if (!isValidEmail(values.email)) {
            errors.email = "Enter a valid email address.";
        }

        if (!values.cnic) {
            errors.cnic = "CNIC is required.";
        } else if (!isValidCnic(values.cnic)) {
            errors.cnic = "Enter a valid CNIC.";
        }
    }

    return { type, values, errors };
};

const buildPayload = (type, values) => type === "warden"
    ? {
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        cnic: values.cnic
    }
    : {
        full_name: values.full_name,
        role: values.role,
        phone: values.phone,
        email: values.email || null,
        salary: values.salary,
        hostel_id: Number(values.hostel_id)
    };

const handleSubmit = async (event) => {
    event.preventDefault();
    clearFieldErrors();
    setFormError("");

    const { type, values, errors } = validateMemberForm();
    Object.entries(errors).forEach(([field, message]) => setFieldError(field, message));

    if (Object.keys(errors).length) {
        setFormError("Correct the highlighted fields before saving.");
        return;
    }

    const baseUrl = type === "warden" ? API.wardens : API.staff;
    const method = editState ? "PUT" : "POST";
    const url = editState ? `${baseUrl}/${editState.id}` : baseUrl;
    const wasEdit = Boolean(editState);

    try {
        await request(url, {
            method,
            body: JSON.stringify(buildPayload(type, values))
        });

        closeMemberModal();
        showPageMessage(`${type === "warden" ? "Warden" : "Staff"} ${wasEdit ? "updated" : "created"} successfully.`);
        await loadPageData();
    } catch (error) {
        setFormError(error.message);
    }
};

const handleDelete = async () => {
    if (!deleteState) {
        return;
    }

    const deletedType = deleteState.type;
    try {
        const url = `${deletedType === "warden" ? API.wardens : API.staff}/${deleteState.id}`;
        await request(url, { method: "DELETE" });
        closeConfirmModal();
        showPageMessage(`${deletedType === "warden" ? "Warden" : "Staff"} deleted successfully.`);
        await loadPageData();
    } catch (error) {
        closeConfirmModal();
        showPageMessage(error.message, "error");
    }
};

const handleTableAction = (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
        return;
    }

    const record = getRecordByKey(button.dataset.type, button.dataset.id);
    if (!record) {
        return;
    }

    if (button.dataset.action === "view") {
        openDetailsModal(record);
        return;
    }

    if (button.dataset.action === "edit") {
        openMemberModal(record.entityType, "edit", record);
        return;
    }

    if (button.dataset.action === "delete") {
        openConfirmModal(record);
    }
};

const initializeEventListeners = () => {
    mobileMenuButton.addEventListener("click", () => body.classList.contains("sidebar-open") ? closeMobileSidebar() : openMobileSidebar());
    mobileOverlay.addEventListener("click", closeMobileSidebar);
    window.addEventListener("resize", handleResize);

    hostelFilter.addEventListener("change", (event) => {
        selectedHostelId = event.target.value;
        renderSections();
    });

    staffSearchInput.addEventListener("input", (event) => {
        searchTerm = event.target.value;
        renderSections();
    });

    openStaffModalButton.addEventListener("click", () => openMemberModal("staff", "create"));
    openWardenModalButton.addEventListener("click", () => openMemberModal("warden", "create"));
    memberForm.addEventListener("submit", handleSubmit);
    confirmDeleteButton.addEventListener("click", handleDelete);

    [fullNameInput, roleInput, phoneInput, emailInput, salaryInput, hostelSelect, cnicInput].forEach((input) => {
        input.addEventListener("input", () => {
            setFormError("");
            Object.keys(fieldMap).forEach((field) => setFieldError(field, ""));
        });
        input.addEventListener("change", () => {
            setFormError("");
            Object.keys(fieldMap).forEach((field) => setFieldError(field, ""));
        });
    });

    wardenTable.addEventListener("click", handleTableAction);
    wardenCards.addEventListener("click", handleTableAction);
    staffTable.addEventListener("click", handleTableAction);
    staffCards.addEventListener("click", handleTableAction);

    document.querySelectorAll("[data-close-member-modal]").forEach((button) => button.addEventListener("click", closeMemberModal));
    document.querySelectorAll("[data-close-details]").forEach((button) => button.addEventListener("click", closeDetailsModal));
    document.querySelectorAll("[data-close-confirm]").forEach((button) => button.addEventListener("click", closeConfirmModal));

    [memberModal, detailsModal, confirmModal].forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target !== modal) {
                return;
            }

            if (modal === memberModal) {
                closeMemberModal();
            } else if (modal === detailsModal) {
                closeDetailsModal();
            } else {
                closeConfirmModal();
            }
        });
    });
};

initializeEventListeners();
handleResize();
void loadPageData();
