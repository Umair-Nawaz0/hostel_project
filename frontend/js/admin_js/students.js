const body = document.body;
const sidebarToggle = document.getElementById("sidebarToggle");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");

const hostelFilter = document.getElementById("hostelFilter");
const roomFilter = document.getElementById("roomFilter");
const studentTable = document.getElementById("studentTable");

const filteredStudentsEl = document.getElementById("filteredStudents");
const activeStudentsEl = document.getElementById("activeStudents");
const selectedHostelNameEl = document.getElementById("selectedHostelName");
const selectedRoomNameEl = document.getElementById("selectedRoomName");

const openStudentModalButton = document.getElementById("openStudentModal");
const studentModal = document.getElementById("studentModal");
const detailsModal = document.getElementById("detailsModal");
const confirmModal = document.getElementById("confirmModal");
const studentForm = document.getElementById("studentForm");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");

const studentNameInput = document.getElementById("studentName");
const studentEmailInput = document.getElementById("studentEmail");
const studentPhoneInput = document.getElementById("studentPhone");
const checkInDateInput = document.getElementById("checkInDate");
const studentHostelInput = document.getElementById("studentHostel");
const studentRoomInput = document.getElementById("studentRoom");
const studentStatusInput = document.getElementById("studentStatus");

const detailsTitle = document.getElementById("detailsTitle");
const detailsContent = document.getElementById("detailsContent");
const confirmText = document.getElementById("confirmText");
const confirmDeleteButton = document.getElementById("confirmDelete");

const hostels = [
    { id: "hostelA", name: "Hostel A" },
    { id: "hostelB", name: "Hostel B" },
    { id: "hostelC", name: "Hostel C" }
];

const rooms = [
    { id: "a101", hostelId: "hostelA", roomNumber: "A-101" },
    { id: "a203", hostelId: "hostelA", roomNumber: "A-203" },
    { id: "a305", hostelId: "hostelA", roomNumber: "A-305" },
    { id: "b110", hostelId: "hostelB", roomNumber: "B-110" },
    { id: "b212", hostelId: "hostelB", roomNumber: "B-212" },
    { id: "c011", hostelId: "hostelC", roomNumber: "C-011" },
    { id: "c120", hostelId: "hostelC", roomNumber: "C-120" }
];

let students = [
    {
        id: 1,
        name: "Ali Raza",
        email: "ali.raza@example.com",
        phone: "+92 300 1112233",
        hostelId: "hostelA",
        roomId: "a101",
        checkInDate: "2025-01-12",
        status: "Active"
    },
    {
        id: 2,
        name: "Sara Khan",
        email: "sara.khan@example.com",
        phone: "+92 300 4445566",
        hostelId: "hostelA",
        roomId: "a203",
        checkInDate: "2025-02-05",
        status: "Active"
    },
    {
        id: 3,
        name: "Usman Tariq",
        email: "usman.tariq@example.com",
        phone: "+92 301 2233445",
        hostelId: "hostelB",
        roomId: "b110",
        checkInDate: "2024-12-20",
        status: "Left"
    },
    {
        id: 4,
        name: "Hina Malik",
        email: "hina.malik@example.com",
        phone: "+92 302 9988776",
        hostelId: "hostelB",
        roomId: "b212",
        checkInDate: "2025-03-03",
        status: "Active"
    },
    {
        id: 5,
        name: "Ahmed Noor",
        email: "ahmed.noor@example.com",
        phone: "+92 333 5533221",
        hostelId: "hostelC",
        roomId: "c011",
        checkInDate: "2025-01-18",
        status: "Active"
    }
];

let selectedHostelId = hostels[0].id;
let selectedRoomId = "all";
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

function populateHostelOptions() {
    const options = hostels.map((hostel) => `<option value="${hostel.id}">${hostel.name}</option>`).join("");
    hostelFilter.innerHTML = options;
    studentHostelInput.innerHTML = options;
    hostelFilter.value = selectedHostelId;
    studentHostelInput.value = selectedHostelId;
}

function getRoomsByHostel(hostelId) {
    return rooms.filter((room) => room.hostelId === hostelId);
}

function populateRoomFilter(hostelId) {
    const roomOptions = getRoomsByHostel(hostelId)
        .map((room) => `<option value="${room.id}">${room.roomNumber}</option>`)
        .join("");

    roomFilter.innerHTML = `<option value="all">All Rooms</option>${roomOptions}`;

    if (selectedRoomId !== "all" && !getRoomsByHostel(hostelId).some((room) => room.id === selectedRoomId)) {
        selectedRoomId = "all";
    }

    roomFilter.value = selectedRoomId;
}

function populateStudentRoomOptions(hostelId, selectedValue = "") {
    const roomOptions = getRoomsByHostel(hostelId)
        .map((room) => `<option value="${room.id}">${room.roomNumber}</option>`)
        .join("");

    studentRoomInput.innerHTML = roomOptions;

    if (selectedValue && getRoomsByHostel(hostelId).some((room) => room.id === selectedValue)) {
        studentRoomInput.value = selectedValue;
    }
}

function getHostelName(hostelId) {
    return hostels.find((hostel) => hostel.id === hostelId)?.name || "Unknown Hostel";
}

function getRoomName(roomId) {
    return rooms.find((room) => room.id === roomId)?.roomNumber || "Unknown Room";
}

function getFilteredStudents() {
    return students.filter((student) => {
        const matchesHostel = student.hostelId === selectedHostelId;
        const matchesRoom = selectedRoomId === "all" || student.roomId === selectedRoomId;
        return matchesHostel && matchesRoom;
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

function updateSummary(filteredStudents) {
    const activeCount = filteredStudents.filter((student) => student.status === "Active").length;
    animateCounter(filteredStudentsEl, filteredStudents.length);
    animateCounter(activeStudentsEl, activeCount);
    selectedHostelNameEl.textContent = getHostelName(selectedHostelId);
    selectedRoomNameEl.textContent = selectedRoomId === "all" ? "All Rooms" : getRoomName(selectedRoomId);
}

function renderStudents() {
    const filteredStudents = getFilteredStudents();
    studentTable.innerHTML = "";

    filteredStudents.forEach((student) => {
        const statusClass = student.status.toLowerCase();
        const row = document.createElement("tr");
        row.innerHTML = `
            <td data-label="Name" class="font-semibold text-white">${student.name}</td>
            <td data-label="Email">${student.email}</td>
            <td data-label="Phone">${student.phone}</td>
            <td data-label="Hostel">${getHostelName(student.hostelId)}</td>
            <td data-label="Room">${getRoomName(student.roomId)}</td>
            <td data-label="Check-in Date">${student.checkInDate}</td>
            <td data-label="Status"><span class="status-badge status-${statusClass}">${student.status}</span></td>
            <td data-label="Actions" class="actions-cell">
                <div class="row-actions">
                    <button class="action-btn" data-action="view" data-id="${student.id}" title="View student" aria-label="View student">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                    <button class="action-btn" data-action="edit" data-id="${student.id}" title="Edit student" aria-label="Edit student">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                    </button>
                    <button class="action-btn" data-action="delete" data-id="${student.id}" title="Delete student" aria-label="Delete student">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path></svg>
                    </button>
                </div>
            </td>
        `;

        studentTable.appendChild(row);
    });

    updateSummary(filteredStudents);
}

function resetForm() {
    studentForm.reset();
    formError.textContent = "";
    editId = null;
    studentHostelInput.value = selectedHostelId;
    populateStudentRoomOptions(selectedHostelId);
    studentStatusInput.value = "Active";
}

function openFormModal(mode, student = null) {
    resetForm();
    modalTitle.textContent = mode === "edit" ? "Edit Student" : "Add Student";

    if (mode === "edit" && student) {
        studentNameInput.value = student.name;
        studentEmailInput.value = student.email;
        studentPhoneInput.value = student.phone;
        checkInDateInput.value = student.checkInDate;
        studentHostelInput.value = student.hostelId;
        populateStudentRoomOptions(student.hostelId, student.roomId);
        studentStatusInput.value = student.status;
        editId = student.id;
    }

    studentModal.classList.remove("hidden");
}

function closeFormModal() {
    studentModal.classList.add("hidden");
    resetForm();
}

function openDetailsModal(student) {
    detailsTitle.textContent = student.name;
    detailsContent.innerHTML = `
        <div class="detail-item"><p class="detail-label">Name</p><p class="detail-value">${student.name}</p></div>
        <div class="detail-item"><p class="detail-label">Email</p><p class="detail-value">${student.email}</p></div>
        <div class="detail-item"><p class="detail-label">Phone</p><p class="detail-value">${student.phone}</p></div>
        <div class="detail-item"><p class="detail-label">Hostel</p><p class="detail-value">${getHostelName(student.hostelId)}</p></div>
        <div class="detail-item"><p class="detail-label">Room</p><p class="detail-value">${getRoomName(student.roomId)}</p></div>
        <div class="detail-item"><p class="detail-label">Check-in Date</p><p class="detail-value">${student.checkInDate}</p></div>
        <div class="detail-item sm:col-span-2"><p class="detail-label">Status</p><p class="detail-value">${student.status}</p></div>
    `;
    detailsModal.classList.remove("hidden");
}

function closeDetailsModal() {
    detailsModal.classList.add("hidden");
}

function openConfirmModal(student) {
    deleteId = student.id;
    confirmText.textContent = `This will remove ${student.name} from ${getHostelName(student.hostelId)}.`;
    confirmModal.classList.remove("hidden");
}

function closeConfirmModal() {
    deleteId = null;
    confirmModal.classList.add("hidden");
}

function validateForm() {
    const name = studentNameInput.value.trim();
    const email = studentEmailInput.value.trim();
    const phone = studentPhoneInput.value.trim();
    const checkInDate = checkInDateInput.value.trim();

    if (!name || !email || !phone || !studentHostelInput.value || !studentRoomInput.value || !checkInDate || !studentStatusInput.value) {
        return "All fields are required.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return "Enter a valid email address.";
    }

    return "";
}

hostelFilter.addEventListener("change", (event) => {
    selectedHostelId = event.target.value;
    selectedRoomId = "all";
    populateRoomFilter(selectedHostelId);
    renderStudents();
});

roomFilter.addEventListener("change", (event) => {
    selectedRoomId = event.target.value;
    renderStudents();
});

studentHostelInput.addEventListener("change", (event) => {
    populateStudentRoomOptions(event.target.value);
    formError.textContent = "";
});

[studentNameInput, studentEmailInput, studentPhoneInput, checkInDateInput, studentRoomInput, studentStatusInput].forEach((input) => {
    input.addEventListener("input", () => {
        formError.textContent = "";
    });
    input.addEventListener("change", () => {
        formError.textContent = "";
    });
});

studentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const error = validateForm();
    if (error) {
        formError.textContent = error;
        return;
    }

    const record = {
        id: editId || Date.now(),
        name: studentNameInput.value.trim(),
        email: studentEmailInput.value.trim(),
        phone: studentPhoneInput.value.trim(),
        hostelId: studentHostelInput.value,
        roomId: studentRoomInput.value,
        checkInDate: checkInDateInput.value,
        status: studentStatusInput.value
    };

    if (editId) {
        students = students.map((student) => student.id === editId ? record : student);
    } else {
        students.unshift(record);
    }

    selectedHostelId = record.hostelId;
    selectedRoomId = "all";
    hostelFilter.value = selectedHostelId;
    populateRoomFilter(selectedHostelId);
    closeFormModal();
    renderStudents();
});

studentTable.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
        return;
    }

    const student = students.find((item) => item.id === Number(button.dataset.id));
    if (!student) {
        return;
    }

    const action = button.dataset.action;

    if (action === "view") {
        openDetailsModal(student);
    } else if (action === "edit") {
        openFormModal("edit", student);
    } else if (action === "delete") {
        openConfirmModal(student);
    }
});

confirmDeleteButton.addEventListener("click", () => {
    if (deleteId === null) {
        return;
    }

    students = students.filter((student) => student.id !== deleteId);
    closeConfirmModal();
    renderStudents();
});

openStudentModalButton.addEventListener("click", () => {
    openFormModal("add");
});

sidebarToggle.addEventListener("click", handleSidebarToggle);
mobileMenuButton.addEventListener("click", openMobileSidebar);
mobileOverlay.addEventListener("click", closeMobileSidebar);
window.addEventListener("resize", handleResize);

document.querySelectorAll("[data-close-student-modal]").forEach((button) => {
    button.addEventListener("click", closeFormModal);
});

document.querySelectorAll("[data-close-details]").forEach((button) => {
    button.addEventListener("click", closeDetailsModal);
});

document.querySelectorAll("[data-close-confirm]").forEach((button) => {
    button.addEventListener("click", closeConfirmModal);
});

[studentModal, detailsModal, confirmModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target !== modal) {
            return;
        }

        if (modal === studentModal) {
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
populateRoomFilter(selectedHostelId);
populateStudentRoomOptions(selectedHostelId);
renderStudents();
