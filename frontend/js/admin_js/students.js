const API = {
    hostels: "http://localhost:5000/api/hostels",
    students: "http://localhost:5000/api/students",
    studentMeta: "http://localhost:5000/api/students/meta"
};

const PHONE_REGEX = /^[+0-9()\-\s]{7,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const body = document.body;
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");
const hostelFilter = document.getElementById("hostelFilter");
const studentSearchInput = document.getElementById("studentSearch");
const studentTable = document.getElementById("studentTable");
const filteredStudentsEl = document.getElementById("filteredStudents");
const activeStudentsEl = document.getElementById("activeStudents");
const selectedHostelNameEl = document.getElementById("selectedHostelName");
const searchQueryLabelEl = document.getElementById("searchQueryLabel");
const openStudentModalButton = document.getElementById("openStudentModal");
const studentModal = document.getElementById("studentModal");
const detailsModal = document.getElementById("detailsModal");
const confirmModal = document.getElementById("confirmModal");
const studentForm = document.getElementById("studentForm");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");
const rollNumberInput = document.getElementById("rollNumber");
const studentNameInput = document.getElementById("studentName");
const studentEmailInput = document.getElementById("studentEmail");
const studentPhoneInput = document.getElementById("studentPhone");
const departmentInput = document.getElementById("department");
const programInput = document.getElementById("program");
const guardianNameInput = document.getElementById("guardianName");
const guardianPhoneInput = document.getElementById("guardianPhone");
const joinDateInput = document.getElementById("joinDate");
const studentStatusInput = document.getElementById("studentStatus");
const detailsTitle = document.getElementById("detailsTitle");
const detailsContent = document.getElementById("detailsContent");
const confirmText = document.getElementById("confirmText");
const confirmDeleteButton = document.getElementById("confirmDelete");

const fieldMap = {
    roll_number: { input: rollNumberInput, error: document.getElementById("rollNumberError") },
    full_name: { input: studentNameInput, error: document.getElementById("studentNameError") },
    email: { input: studentEmailInput, error: document.getElementById("studentEmailError") },
    phone: { input: studentPhoneInput, error: document.getElementById("studentPhoneError") },
    department: { input: departmentInput, error: document.getElementById("departmentError") },
    program: { input: programInput, error: document.getElementById("programError") },
    guardian_name: { input: guardianNameInput, error: document.getElementById("guardianNameError") },
    guardian_phone: { input: guardianPhoneInput, error: document.getElementById("guardianPhoneError") },
    join_date: { input: joinDateInput, error: document.getElementById("joinDateError") },
    status: { input: studentStatusInput, error: document.getElementById("studentStatusError") }
};

let hostels = [];
let students = [];
let filteredStudents = [];
let studentMeta = { statuses: [] };
let selectedHostelId = "";
let studentSearchTerm = "";
let editId = null;
let deleteId = null;
let loadRequestId = 0;
let studentMetaWarning = "";

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
    const start = Number(element.textContent.replace(/,/g, "")) || 0;
    const startTime = performance.now();
    const duration = 700;
    const update = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(start + (target - start) * eased).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
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

const logStudentWarning = (message, error = null) => {
    if (error) {
        console.error(message, error);
        return;
    }

    console.warn(message);
};

const safeText = (value, fallback = "Not Available") => {
    const normalized = typeof value === "string" ? value.trim() : value;
    return normalized ? normalized : fallback;
};

const normalizeOptionalText = (value) => {
    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim().replace(/\s+/g, " ");
    return normalized ? normalized : null;
};

const getHostelName = (id) => hostels.find((hostel) => hostel.id === Number(id))?.name || "All Hostels";

const normalizeSearchTerm = (value) => typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").toLowerCase()
    : "";

const normalizeStudent = (row) => ({
    id: Number(row.student_id || row.id),
    rollNumber: safeText(row.roll_number || row.rollNumber, "N/A"),
    name: safeText(row.full_name || row.name, "Unnamed Student"),
    email: safeText(row.email),
    phone: safeText(row.phone),
    department: safeText(row.department, "N/A"),
    program: safeText(row.program, "N/A"),
    guardianName: safeText(row.guardian_name, "N/A"),
    guardianPhone: safeText(row.guardian_phone, "N/A"),
    hostelId: row.hostel_id ? Number(row.hostel_id) : null,
    hostel: safeText(row.hostel_name || row.hostel, "Unassigned Hostel"),
    roomId: row.room_id ? Number(row.room_id) : null,
    roomName: safeText(row.room_number || row.roomName, "Not Assigned"),
    joinDate: safeText(row.join_date || row.joinDate || row.checkInDate, "Not Available"),
    status: safeText(row.status, "Unknown")
});

const populateStatusOptions = () => {
    const selectedValue = studentStatusInput.value;
    studentStatusInput.innerHTML = [`<option value="">Select Status</option>`]
        .concat(studentMeta.statuses.map((status) => `<option value="${status}">${status}</option>`))
        .join("");
    studentStatusInput.value = studentMeta.statuses.includes(selectedValue) ? selectedValue : "";
};

const populateHostelOptions = () => {
    const filterOptions = [`<option value="">All Hostels</option>`]
        .concat(hostels.map((hostel) => `<option value="${hostel.id}">${hostel.name}</option>`))
        .join("");
    hostelFilter.innerHTML = filterOptions;
    hostelFilter.value = selectedHostelId;
};

const matchesStudentSearch = (student, normalizedSearchTerm) => {
    if (!normalizedSearchTerm) {
        return true;
    }

    const name = normalizeSearchTerm(student.name);
    const rollNumber = normalizeSearchTerm(student.rollNumber);
    return name.includes(normalizedSearchTerm) || rollNumber.includes(normalizedSearchTerm);
};

const applyStudentFilters = () => {
    const normalizedSearchTerm = normalizeSearchTerm(studentSearchTerm);
    filteredStudents = students.filter((student) => {
        const matchesHostel = !selectedHostelId || student.hostelId === Number(selectedHostelId);
        return matchesHostel && matchesStudentSearch(student, normalizedSearchTerm);
    });
};

const updateSummary = () => {
    animateCounter(filteredStudentsEl, filteredStudents.length);
    animateCounter(activeStudentsEl, filteredStudents.filter((student) => student.status === "Active").length);
    selectedHostelNameEl.textContent = selectedHostelId ? getHostelName(selectedHostelId) : "All Hostels";
    searchQueryLabelEl.textContent = studentSearchTerm ? studentSearchTerm : "All Students";
};

const renderStudents = () => {
    studentTable.innerHTML = "";
    applyStudentFilters();
    if (!filteredStudents.length) {
        const emptyMessage = selectedHostelId || studentSearchTerm
            ? "No students match the current hostel filter and search."
            : "No students found.";
        studentTable.innerHTML = `<tr><td colspan="9" class="py-10 text-center text-slate-400">${emptyMessage}</td></tr>`;
        updateSummary();
        return;
    }

    filteredStudents.forEach((student) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td data-label="Name" class="font-semibold text-white">${student.name}</td>
            <td data-label="Roll Number">${student.rollNumber}</td>
            <td data-label="Email">${student.email}</td>
            <td data-label="Phone">${student.phone}</td>
            <td data-label="Hostel">${student.hostel}</td>
            <td data-label="Room">${student.roomName}</td>
            <td data-label="Check-in">${student.joinDate}</td>
            <td data-label="Status"><span class="status-badge status-${student.status.toLowerCase().replace(/\s+/g, "-")}">${student.status}</span></td>
            <td data-label="Actions" class="actions-cell">
                <div class="row-actions">
                    <button class="action-btn" data-action="view" data-id="${student.id}" title="View student" aria-label="View student">View</button>
                    <button class="action-btn" data-action="edit" data-id="${student.id}" title="Edit student" aria-label="Edit student">Edit</button>
                    <button class="action-btn" data-action="delete" data-id="${student.id}" title="Delete student" aria-label="Delete student">Delete</button>
                </div>
            </td>
        `;
        studentTable.appendChild(row);
    });

    updateSummary();
};

const loadStudents = async (requestId) => {
    const payload = await request(API.students);
    if (requestId !== loadRequestId) {
        return;
    }
    students = (payload.data || []).map(normalizeStudent);
    renderStudents();
};

const loadPageData = async () => {
    const requestId = ++loadRequestId;
    studentTable.innerHTML = `<tr><td colspan="9" class="py-10 text-center text-slate-400">Loading students...</td></tr>`;

    try {
        if (!hostels.length) {
            const hostelPayload = await request(API.hostels);
            hostels = (hostelPayload.data || []).map((row) => ({
                id: Number(row.hostel_id),
                name: safeText(row.hostel_name, "Unnamed Hostel")
            }));
            populateHostelOptions();
        }

        if (!studentMeta.statuses.length) {
            try {
                const studentMetaPayload = await request(API.studentMeta);
                studentMeta = {
                    statuses: Array.isArray(studentMetaPayload.statuses)
                        ? studentMetaPayload.statuses
                        : (Array.isArray(studentMetaPayload.data?.statuses) ? studentMetaPayload.data.statuses : [])
                };
                studentMetaWarning = "";
                populateStatusOptions();
            } catch (metaError) {
                studentMeta = { statuses: [] };
                studentMetaWarning = "Student status options are temporarily unavailable.";
                populateStatusOptions();
                logStudentWarning("Unable to load student status metadata.", metaError);
            }
        }
        await loadStudents(requestId);
    } catch (error) {
        if (requestId !== loadRequestId) {
            return;
        }
        studentTable.innerHTML = `<tr><td colspan="9" class="py-10 text-center text-slate-400">${error.message}</td></tr>`;
    }
};

const resetForm = () => {
    studentForm.reset();
    editId = null;
    clearFieldErrors();
    populateStatusOptions();
    studentStatusInput.value = studentMeta.statuses.includes("Active") ? "Active" : (studentMeta.statuses[0] || "");
    setFormError("");
};

const openFormModal = (mode, student = null) => {
    resetForm();
    modalTitle.textContent = mode === "edit" ? "Edit Student" : "Add Student";
    if (!studentMeta.statuses.length) {
        setFormError(studentMetaWarning || "Student metadata is unavailable. Status options could not be loaded.");
    }
    if (mode === "edit" && student) {
        rollNumberInput.value = student.rollNumber === "N/A" ? "" : student.rollNumber;
        studentNameInput.value = student.name;
        studentEmailInput.value = student.email === "Not Available" ? "" : student.email;
        studentPhoneInput.value = student.phone === "Not Available" ? "" : student.phone;
        departmentInput.value = student.department === "N/A" ? "" : student.department;
        programInput.value = student.program === "N/A" ? "" : student.program;
        guardianNameInput.value = student.guardianName === "N/A" ? "" : student.guardianName;
        guardianPhoneInput.value = student.guardianPhone === "N/A" ? "" : student.guardianPhone;
        joinDateInput.value = student.joinDate === "Not Available" ? "" : student.joinDate;
        studentStatusInput.value = student.status;
        editId = student.id;
    }
    studentModal.classList.remove("hidden");
};

const closeFormModal = () => {
    studentModal.classList.add("hidden");
    resetForm();
};

const openDetailsModal = (student) => {
    detailsTitle.textContent = student.name;
    detailsContent.innerHTML = `
        <div class="detail-item"><p class="detail-label">Roll Number</p><p class="detail-value">${student.rollNumber}</p></div>
        <div class="detail-item"><p class="detail-label">Full Name</p><p class="detail-value">${student.name}</p></div>
        <div class="detail-item"><p class="detail-label">Email</p><p class="detail-value">${student.email}</p></div>
        <div class="detail-item"><p class="detail-label">Phone</p><p class="detail-value">${student.phone}</p></div>
        <div class="detail-item"><p class="detail-label">Department</p><p class="detail-value">${student.department}</p></div>
        <div class="detail-item"><p class="detail-label">Program</p><p class="detail-value">${student.program}</p></div>
        <div class="detail-item"><p class="detail-label">Guardian Name</p><p class="detail-value">${student.guardianName}</p></div>
        <div class="detail-item"><p class="detail-label">Guardian Phone</p><p class="detail-value">${student.guardianPhone}</p></div>
        <div class="detail-item"><p class="detail-label">Join Date</p><p class="detail-value">${student.joinDate}</p></div>
        <div class="detail-item"><p class="detail-label">Status</p><p class="detail-value">${student.status}</p></div>
        <div class="detail-item"><p class="detail-label">Hostel</p><p class="detail-value">${student.hostel}</p></div>
        <div class="detail-item"><p class="detail-label">Room</p><p class="detail-value">${student.roomName}</p></div>
    `;
    detailsModal.classList.remove("hidden");
};

const closeDetailsModal = () => detailsModal.classList.add("hidden");

const openConfirmModal = (student) => {
    deleteId = student.id;
    confirmText.textContent = `This will remove ${student.name} from ${student.hostel}.`;
    confirmModal.classList.remove("hidden");
};

const closeConfirmModal = () => {
    deleteId = null;
    confirmModal.classList.add("hidden");
};

const validateStudentForm = () => {
    const values = {
        roll_number: rollNumberInput.value.trim(),
        full_name: studentNameInput.value.trim(),
        email: studentEmailInput.value.trim(),
        phone: studentPhoneInput.value.trim(),
        department: departmentInput.value.trim(),
        program: programInput.value.trim(),
        guardian_name: guardianNameInput.value.trim(),
        guardian_phone: guardianPhoneInput.value.trim(),
        join_date: joinDateInput.value,
        status: studentStatusInput.value
    };

    const errors = {};

    if (!values.roll_number) {
        errors.roll_number = "Roll number is required.";
    } else if (values.roll_number.length < 3 || values.roll_number.length > 20) {
        errors.roll_number = "Roll number must be 3-20 characters.";
    }

    if (!values.full_name) {
        errors.full_name = "Full name is required.";
    } else if (values.full_name.length < 2 || values.full_name.length > 100) {
        errors.full_name = "Full name must be 2-100 characters.";
    }

    if (!values.email) {
        errors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(values.email)) {
        errors.email = "Enter a valid email address.";
    }

    if (!values.phone) {
        errors.phone = "Phone is required.";
    } else if (!PHONE_REGEX.test(values.phone)) {
        errors.phone = "Enter a valid phone number.";
    }

    if (!values.department) {
        errors.department = "Department is required.";
    } else if (values.department.length > 100) {
        errors.department = "Department must be at most 100 characters.";
    }

    if (!values.program) {
        errors.program = "Program is required.";
    } else if (values.program.length > 60) {
        errors.program = "Program must be at most 60 characters.";
    }

    if (values.guardian_name && values.guardian_name.length > 100) {
        errors.guardian_name = "Guardian name must be at most 100 characters.";
    }

    if (values.guardian_phone && !PHONE_REGEX.test(values.guardian_phone)) {
        errors.guardian_phone = "Enter a valid guardian phone number.";
    }

    if (!values.join_date || Number.isNaN(Date.parse(values.join_date))) {
        errors.join_date = "Join date is required and must be valid.";
    }

    if (!studentMeta.statuses.length) {
        errors.status = studentMetaWarning || "Status options could not be loaded.";
    } else if (!studentMeta.statuses.includes(values.status)) {
        errors.status = "Select a valid status.";
    }

    return errors;
};

const applyValidationErrors = (errors) => {
    clearFieldErrors();
    Object.entries(errors).forEach(([field, message]) => {
        setFieldError(field, message);
    });
};

const buildStudentPayload = () => ({
    roll_number: rollNumberInput.value.trim(),
    full_name: studentNameInput.value.trim(),
    email: studentEmailInput.value.trim(),
    phone: studentPhoneInput.value.trim(),
    department: departmentInput.value.trim(),
    program: programInput.value.trim(),
    guardian_name: normalizeOptionalText(guardianNameInput.value),
    guardian_phone: normalizeOptionalText(guardianPhoneInput.value),
    join_date: joinDateInput.value,
    status: studentStatusInput.value
});

hostelFilter.addEventListener("change", (event) => {
    selectedHostelId = event.target.value;
    renderStudents();
});

studentSearchInput.addEventListener("input", (event) => {
    studentSearchTerm = event.target.value.trim().replace(/\s+/g, " ");
    renderStudents();
});

studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const errors = validateStudentForm();
    applyValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
        return setFormError("Correct the highlighted fields before saving.");
    }

    const payload = buildStudentPayload();

    try {
        if (editId) {
            await request(`${API.students}/${editId}`, { method: "PUT", body: JSON.stringify(payload) });
            window.alert("Student updated successfully.");
        } else {
            await request(API.students, { method: "POST", body: JSON.stringify(payload) });
            window.alert("Student added successfully.");
        }
        closeFormModal();
        await loadPageData();
    } catch (submitError) {
        setFormError(submitError.message);
    }
});

studentTable.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const student = filteredStudents.find((item) => item.id === Number(button.dataset.id))
        || students.find((item) => item.id === Number(button.dataset.id));
    if (!student) return;
    if (button.dataset.action === "view") openDetailsModal(student);
    if (button.dataset.action === "edit") openFormModal("edit", student);
    if (button.dataset.action === "delete") openConfirmModal(student);
});

confirmDeleteButton.addEventListener("click", async () => {
    if (deleteId === null) return;
    try {
        await request(`${API.students}/${deleteId}`, { method: "DELETE" });
        window.alert("Student deleted successfully.");
        closeConfirmModal();
        await loadPageData();
    } catch (error) {
        window.alert(error.message);
    }
});

openStudentModalButton.addEventListener("click", () => openFormModal("add"));
mobileMenuButton.addEventListener("click", toggleSidebar);
mobileOverlay.addEventListener("click", closeMobileSidebar);
window.addEventListener("resize", handleResize);
document.querySelectorAll("[data-close-student-modal]").forEach((button) => button.addEventListener("click", closeFormModal));
document.querySelectorAll("[data-close-details]").forEach((button) => button.addEventListener("click", closeDetailsModal));
document.querySelectorAll("[data-close-confirm]").forEach((button) => button.addEventListener("click", closeConfirmModal));
[studentModal, detailsModal, confirmModal].forEach((modal) => modal.addEventListener("click", (event) => {
    if (event.target !== modal) return;
    if (modal === studentModal) closeFormModal();
    else if (modal === detailsModal) closeDetailsModal();
    else closeConfirmModal();
}));

[
    ["roll_number", rollNumberInput, "input"],
    ["full_name", studentNameInput, "input"],
    ["email", studentEmailInput, "input"],
    ["phone", studentPhoneInput, "input"],
    ["department", departmentInput, "input"],
    ["program", programInput, "input"],
    ["guardian_name", guardianNameInput, "input"],
    ["guardian_phone", guardianPhoneInput, "input"],
    ["join_date", joinDateInput, "input"],
    ["status", studentStatusInput, "change"]
].forEach(([field, input, eventName]) => {
    input.addEventListener(eventName, () => {
        setFieldError(field, "");
        setFormError("");
    });
});

handleResize();
void loadPageData();
