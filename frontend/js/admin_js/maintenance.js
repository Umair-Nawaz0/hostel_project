const body = document.body;
const sidebarToggle = document.getElementById("sidebarToggle");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");

const hostelFilter = document.getElementById("hostelFilter");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchInput");
const maintenanceTable = document.getElementById("maintenanceTable");

const filteredCountEl = document.getElementById("filteredCount");
const inProgressCountEl = document.getElementById("inProgressCount");
const completedCountEl = document.getElementById("completedCount");
const selectedHostelNameEl = document.getElementById("selectedHostelName");

const openMaintenanceModalButton = document.getElementById("openMaintenanceModal");
const maintenanceModal = document.getElementById("maintenanceModal");
const maintenanceForm = document.getElementById("maintenanceForm");
const modalTitle = document.getElementById("modalTitle");
const complaintSelect = document.getElementById("complaintSelect");
const staffSelect = document.getElementById("staffSelect");
const assignedDateInput = document.getElementById("assignedDate");
const statusInput = document.getElementById("maintenanceStatus");
const completedDateField = document.getElementById("completedDateField");
const completedDateInput = document.getElementById("completedDate");
const remarksInput = document.getElementById("remarks");
const formError = document.getElementById("formError");

const detailsModal = document.getElementById("detailsModal");
const detailsTitle = document.getElementById("detailsTitle");
const detailsContent = document.getElementById("detailsContent");

const hostels = [
    { id: "hostelA", name: "Hostel A" },
    { id: "hostelB", name: "Hostel B" },
    { id: "hostelC", name: "Hostel C" }
];

const students = [
    { id: "STD-001", name: "Ali Raza", hostelId: "hostelA" },
    { id: "STD-002", name: "Sara Khan", hostelId: "hostelA" },
    { id: "STD-003", name: "Usman Tariq", hostelId: "hostelB" },
    { id: "STD-004", name: "Hina Malik", hostelId: "hostelB" },
    { id: "STD-005", name: "Ahmed Noor", hostelId: "hostelC" }
];

const complaints = [
    {
        id: "CMP-1001",
        studentId: "STD-001",
        hostelId: "hostelA",
        description: "Water leakage in the shared washroom near Room A-101.",
        date: "2025-05-02"
    },
    {
        id: "CMP-1002",
        studentId: "STD-002",
        hostelId: "hostelA",
        description: "Ceiling fan in Room A-203 stops randomly and creates noise.",
        date: "2025-05-04"
    },
    {
        id: "CMP-1003",
        studentId: "STD-003",
        hostelId: "hostelB",
        description: "Wi-Fi signal on the second floor has been unstable for three days.",
        date: "2025-05-05"
    },
    {
        id: "CMP-1004",
        studentId: "STD-004",
        hostelId: "hostelB",
        description: "Mess serving counter refrigeration unit is not cooling properly.",
        date: "2025-05-07"
    },
    {
        id: "CMP-1005",
        studentId: "STD-005",
        hostelId: "hostelC",
        description: "Main corridor lights keep flickering during evening hours.",
        date: "2025-05-08"
    }
];

const staffMembers = [
    { id: "STF-201", name: "Hamza Qureshi", hostelId: "hostelA", role: "Staff" },
    { id: "STF-202", name: "Nadia Aziz", hostelId: "hostelA", role: "Warden" },
    { id: "STF-203", name: "Bilal Saeed", hostelId: "hostelB", role: "Staff" },
    { id: "STF-204", name: "Areeba Javed", hostelId: "hostelB", role: "Warden" },
    { id: "STF-205", name: "Zain Tariq", hostelId: "hostelC", role: "Staff" }
];

let maintenanceRecords = [
    {
        id: "MNT-3001",
        complaintId: "CMP-1001",
        staffId: "STF-201",
        assignedDate: "2025-05-03",
        completedDate: "",
        status: "Assigned",
        remarks: "Plumber visit scheduled for morning shift."
    },
    {
        id: "MNT-3002",
        complaintId: "CMP-1003",
        staffId: "STF-203",
        assignedDate: "2025-05-05",
        completedDate: "",
        status: "In Progress",
        remarks: "Router diagnostics completed. Cable replacement pending."
    },
    {
        id: "MNT-3003",
        complaintId: "CMP-1005",
        staffId: "STF-205",
        assignedDate: "2025-05-08",
        completedDate: "2025-05-09",
        status: "Completed",
        remarks: "Corridor fittings replaced and voltage issue resolved."
    }
];

let selectedHostelId = "All";
let selectedStatus = "All";
let editingMaintenanceId = null;

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

function getHostelName(hostelId) {
    return hostels.find((hostel) => hostel.id === hostelId)?.name || "Unknown Hostel";
}

function getStudent(studentId) {
    return students.find((student) => student.id === studentId);
}

function getComplaint(complaintId) {
    return complaints.find((complaint) => complaint.id === complaintId);
}

function getStaff(staffId) {
    return staffMembers.find((staff) => staff.id === staffId);
}

function getComplaintHostelId(complaintId) {
    return getComplaint(complaintId)?.hostelId || "";
}

function populateHostelOptions() {
    hostelFilter.innerHTML = `
        <option value="All">All Hostels</option>
        ${hostels.map((hostel) => `<option value="${hostel.id}">${hostel.name}</option>`).join("")}
    `;
    hostelFilter.value = selectedHostelId;
}

function getComplaintLabel(complaint) {
    const student = getStudent(complaint.studentId);
    return `${complaint.id} - ${student?.name || "Student"} - ${getHostelName(complaint.hostelId)}`;
}

function getAvailableComplaintsForModal() {
    if (editingMaintenanceId) {
        return complaints;
    }

    const usedComplaintIds = new Set(maintenanceRecords.map((record) => record.complaintId));
    return complaints.filter((complaint) => !usedComplaintIds.has(complaint.id));
}

function populateComplaintOptions(selectedComplaintId = "") {
    const availableComplaints = getAvailableComplaintsForModal();
    complaintSelect.innerHTML = `
        <option value="">Select complaint</option>
        ${availableComplaints.map((complaint) => `<option value="${complaint.id}">${getComplaintLabel(complaint)}</option>`).join("")}
    `;

    if (selectedComplaintId && complaints.some((complaint) => complaint.id === selectedComplaintId)) {
        if (!availableComplaints.some((complaint) => complaint.id === selectedComplaintId)) {
            const complaint = getComplaint(selectedComplaintId);
            complaintSelect.insertAdjacentHTML("beforeend", `<option value="${complaint.id}">${getComplaintLabel(complaint)}</option>`);
        }
        complaintSelect.value = selectedComplaintId;
    }
}

function populateStaffOptions(hostelId, selectedStaffId = "") {
    const filteredStaff = staffMembers.filter((staff) => staff.hostelId === hostelId);
    staffSelect.innerHTML = `
        <option value="">Select staff</option>
        ${filteredStaff.map((staff) => `<option value="${staff.id}">${staff.name} (${staff.role})</option>`).join("")}
    `;

    if (selectedStaffId) {
        staffSelect.value = selectedStaffId;
    }
}

function toggleCompletedDateField() {
    const isCompleted = statusInput.value === "Completed";
    completedDateField.classList.toggle("hidden", !isCompleted);

    if (!isCompleted) {
        completedDateInput.value = "";
    } else if (!completedDateInput.value) {
        completedDateInput.value = assignedDateInput.value || new Date().toISOString().slice(0, 10);
    }
}

function openMaintenanceModal(record = null) {
    editingMaintenanceId = record?.id || null;
    modalTitle.textContent = editingMaintenanceId ? "Update Maintenance" : "Assign Maintenance";
    formError.classList.add("hidden");
    formError.textContent = "";

    populateComplaintOptions(record?.complaintId || "");

    const complaintId = record?.complaintId || complaintSelect.value;
    const hostelId = getComplaintHostelId(complaintId);
    populateStaffOptions(hostelId, record?.staffId || "");

    assignedDateInput.value = record?.assignedDate || new Date().toISOString().slice(0, 10);
    statusInput.value = record?.status || "Assigned";
    completedDateInput.value = record?.completedDate || "";
    remarksInput.value = record?.remarks || "";
    toggleCompletedDateField();

    maintenanceModal.classList.remove("hidden");
}

function closeMaintenanceModal() {
    maintenanceModal.classList.add("hidden");
    maintenanceForm.reset();
    complaintSelect.innerHTML = "";
    staffSelect.innerHTML = "";
    completedDateField.classList.add("hidden");
    editingMaintenanceId = null;
    formError.classList.add("hidden");
    formError.textContent = "";
}

function openDetailsModal(record) {
    const complaint = getComplaint(record.complaintId);
    const student = complaint ? getStudent(complaint.studentId) : null;
    const staff = getStaff(record.staffId);

    detailsTitle.textContent = record.id;
    detailsContent.innerHTML = `
        <div class="detail-item"><p class="detail-label">Complaint ID</p><p class="detail-value">${record.complaintId}</p></div>
        <div class="detail-item"><p class="detail-label">Student Name</p><p class="detail-value">${student?.name || "Unknown Student"}</p></div>
        <div class="detail-item"><p class="detail-label">Hostel</p><p class="detail-value">${complaint ? getHostelName(complaint.hostelId) : "Unknown Hostel"}</p></div>
        <div class="detail-item"><p class="detail-label">Assigned Staff</p><p class="detail-value">${staff?.name || "Unassigned"}</p></div>
        <div class="detail-item"><p class="detail-label">Assigned Date</p><p class="detail-value">${record.assignedDate}</p></div>
        <div class="detail-item"><p class="detail-label">Completed Date</p><p class="detail-value">${record.completedDate || "Not completed"}</p></div>
        <div class="detail-item sm:col-span-2"><p class="detail-label">Complaint Description</p><p class="detail-value">${complaint?.description || "No complaint details available."}</p></div>
        <div class="detail-item"><p class="detail-label">Status</p><p class="detail-value">${record.status}</p></div>
        <div class="detail-item sm:col-span-2"><p class="detail-label">Remarks</p><p class="detail-value">${record.remarks || "No remarks added."}</p></div>
    `;

    detailsModal.classList.remove("hidden");
}

function closeDetailsModal() {
    detailsModal.classList.add("hidden");
}

function getFilteredRecords() {
    const query = searchInput.value.trim().toLowerCase();

    return maintenanceRecords.filter((record) => {
        const complaint = getComplaint(record.complaintId);
        const student = complaint ? getStudent(complaint.studentId) : null;
        const staff = getStaff(record.staffId);
        const matchesHostel = selectedHostelId === "All" || complaint?.hostelId === selectedHostelId;
        const matchesStatus = selectedStatus === "All" || record.status === selectedStatus;
        const matchesSearch = !query
            || record.id.toLowerCase().includes(query)
            || record.complaintId.toLowerCase().includes(query)
            || (student?.name || "").toLowerCase().includes(query)
            || (staff?.name || "").toLowerCase().includes(query)
            || (complaint?.description || "").toLowerCase().includes(query);

        return matchesHostel && matchesStatus && matchesSearch;
    });
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

function updateSummary(filteredRecords) {
    animateCounter(filteredCountEl, filteredRecords.length);
    animateCounter(inProgressCountEl, filteredRecords.filter((record) => record.status === "In Progress").length);
    animateCounter(completedCountEl, filteredRecords.filter((record) => record.status === "Completed").length);
    selectedHostelNameEl.textContent = selectedHostelId === "All" ? "All Hostels" : getHostelName(selectedHostelId);
}

function renderMaintenance() {
    const filteredRecords = getFilteredRecords();
    maintenanceTable.innerHTML = "";

    filteredRecords.forEach((record) => {
        const complaint = getComplaint(record.complaintId);
        const student = complaint ? getStudent(complaint.studentId) : null;
        const staff = getStaff(record.staffId);
        const statusClass = record.status.toLowerCase().replace(/\s+/g, "-");

        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="font-semibold text-white">${record.id}</td>
            <td>${record.complaintId}</td>
            <td>${student?.name || "Unknown Student"}</td>
            <td>${complaint ? getHostelName(complaint.hostelId) : "Unknown Hostel"}</td>
            <td>${staff?.name || "Unassigned"}</td>
            <td>${record.assignedDate}</td>
            <td><span class="status-badge status-${statusClass}">${record.status}</span></td>
            <td>
                <div class="action-group">
                    <button class="action-btn" data-action="view" data-id="${record.id}">View Details</button>
                    <button class="action-btn" data-action="edit" data-id="${record.id}">Edit</button>
                </div>
            </td>
        `;
        maintenanceTable.appendChild(row);
    });

    if (!filteredRecords.length) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td colspan="8" class="py-10 text-center text-slate-400">
                No maintenance records match the selected filters.
            </td>
        `;
        maintenanceTable.appendChild(row);
    }

    updateSummary(filteredRecords);
}

function showFormError(message) {
    formError.textContent = message;
    formError.classList.remove("hidden");
}

function getNextMaintenanceId() {
    const currentMax = maintenanceRecords.reduce((max, record) => {
        const numericPart = Number(record.id.replace(/\D/g, ""));
        return Math.max(max, numericPart);
    }, 3000);
    const nextNumber = currentMax + 1;
    return `MNT-${nextNumber}`;
}

hostelFilter.addEventListener("change", (event) => {
    selectedHostelId = event.target.value;
    renderMaintenance();
});

statusFilter.addEventListener("change", (event) => {
    selectedStatus = event.target.value;
    renderMaintenance();
});

searchInput.addEventListener("input", renderMaintenance);

openMaintenanceModalButton.addEventListener("click", () => {
    openMaintenanceModal();
});

complaintSelect.addEventListener("change", () => {
    const hostelId = getComplaintHostelId(complaintSelect.value);
    populateStaffOptions(hostelId);
});

statusInput.addEventListener("change", toggleCompletedDateField);

maintenanceForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const complaintId = complaintSelect.value;
    const staffId = staffSelect.value;
    const assignedDate = assignedDateInput.value;
    const status = statusInput.value;
    const completedDate = completedDateInput.value;
    const remarks = remarksInput.value.trim();

    if (!complaintId || !staffId || !assignedDate || !status || !remarks) {
        showFormError("All fields are required.");
        return;
    }

    if (status === "Completed" && !completedDate) {
        showFormError("Completed date is required when status is completed.");
        return;
    }

    const complaintHostelId = getComplaintHostelId(complaintId);
    const selectedStaff = getStaff(staffId);
    if (!selectedStaff || selectedStaff.hostelId !== complaintHostelId) {
        showFormError("Select staff from the same hostel as the complaint.");
        return;
    }

    const payload = {
        complaintId,
        staffId,
        assignedDate,
        completedDate: status === "Completed" ? completedDate : "",
        status,
        remarks
    };

    if (editingMaintenanceId) {
        maintenanceRecords = maintenanceRecords.map((record) => (
            record.id === editingMaintenanceId ? { ...record, ...payload } : record
        ));
    } else {
        maintenanceRecords.unshift({
            id: getNextMaintenanceId(),
            ...payload
        });
    }

    closeMaintenanceModal();
    renderMaintenance();
});

maintenanceTable.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (!button) {
        return;
    }

    const record = maintenanceRecords.find((item) => item.id === button.dataset.id);
    if (!record) {
        return;
    }

    if (button.dataset.action === "view") {
        openDetailsModal(record);
        return;
    }

    if (button.dataset.action === "edit") {
        openMaintenanceModal(record);
    }
});

sidebarToggle.addEventListener("click", handleSidebarToggle);
mobileMenuButton.addEventListener("click", openMobileSidebar);
mobileOverlay.addEventListener("click", closeMobileSidebar);
window.addEventListener("resize", handleResize);

document.querySelectorAll("[data-close-details]").forEach((button) => {
    button.addEventListener("click", closeDetailsModal);
});

document.querySelectorAll("[data-close-form]").forEach((button) => {
    button.addEventListener("click", closeMaintenanceModal);
});

detailsModal.addEventListener("click", (event) => {
    if (event.target === detailsModal) {
        closeDetailsModal();
    }
});

maintenanceModal.addEventListener("click", (event) => {
    if (event.target === maintenanceModal) {
        closeMaintenanceModal();
    }
});

handleResize();
populateHostelOptions();
renderMaintenance();
