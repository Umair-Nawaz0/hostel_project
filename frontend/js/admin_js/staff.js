const body = document.body;
const sidebarToggle = document.getElementById("sidebarToggle");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");

const hostelFilter = document.getElementById("hostelFilter");
const roleFilter = document.getElementById("roleFilter");
const staffTable = document.getElementById("staffTable");

const filteredStaffEl = document.getElementById("filteredStaff");
const activeStaffEl = document.getElementById("activeStaff");
const selectedHostelNameEl = document.getElementById("selectedHostelName");
const selectedRoleNameEl = document.getElementById("selectedRoleName");

const openStaffModalButton = document.getElementById("openStaffModal");
const staffModal = document.getElementById("staffModal");
const detailsModal = document.getElementById("detailsModal");
const confirmModal = document.getElementById("confirmModal");
const staffForm = document.getElementById("staffForm");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");

const staffNameInput = document.getElementById("staffName");
const staffEmailInput = document.getElementById("staffEmail");
const staffPhoneInput = document.getElementById("staffPhone");
const staffRoleInput = document.getElementById("staffRole");
const staffHostelInput = document.getElementById("staffHostel");
const staffSalaryInput = document.getElementById("staffSalary");
const staffStatusInput = document.getElementById("staffStatus");

const detailsTitle = document.getElementById("detailsTitle");
const detailsContent = document.getElementById("detailsContent");
const confirmText = document.getElementById("confirmText");
const confirmDeleteButton = document.getElementById("confirmDelete");

const hostels = [
    { id: "hostelA", name: "Hostel A" },
    { id: "hostelB", name: "Hostel B" },
    { id: "hostelC", name: "Hostel C" }
];

let staffMembers = [
    {
        id: 1,
        name: "Ayesha Malik",
        email: "ayesha.malik@example.com",
        phone: "+92 300 7788990",
        role: "Warden",
        hostelId: "hostelA",
        salary: 85000,
        status: "Active"
    },
    {
        id: 2,
        name: "Bilal Hussain",
        email: "bilal.hussain@example.com",
        phone: "+92 302 1119988",
        role: "Staff",
        hostelId: "hostelA",
        salary: 52000,
        status: "Active"
    },
    {
        id: 3,
        name: "Hamza Rauf",
        email: "hamza.rauf@example.com",
        phone: "+92 301 6655443",
        role: "Warden",
        hostelId: "hostelB",
        salary: 90000,
        status: "Inactive"
    },
    {
        id: 4,
        name: "Sana Ahmed",
        email: "sana.ahmed@example.com",
        phone: "+92 333 4422110",
        role: "Staff",
        hostelId: "hostelB",
        salary: 48000,
        status: "Active"
    },
    {
        id: 5,
        name: "Omar Khan",
        email: "omar.khan@example.com",
        phone: "+92 300 1238877",
        role: "Staff",
        hostelId: "hostelC",
        salary: 46000,
        status: "Active"
    }
];

let selectedHostelId = hostels[0].id;
let selectedRole = "All";
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
    staffHostelInput.innerHTML = options;
    hostelFilter.value = selectedHostelId;
    staffHostelInput.value = selectedHostelId;
}

function getHostelName(hostelId) {
    return hostels.find((hostel) => hostel.id === hostelId)?.name || "Unknown Hostel";
}

function getFilteredStaff() {
    return staffMembers.filter((member) => {
        const matchesHostel = member.hostelId === selectedHostelId;
        const matchesRole = selectedRole === "All" || member.role === selectedRole;
        return matchesHostel && matchesRole;
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

function updateSummary(filteredStaff) {
    const activeCount = filteredStaff.filter((member) => member.status === "Active").length;
    animateCounter(filteredStaffEl, filteredStaff.length);
    animateCounter(activeStaffEl, activeCount);
    selectedHostelNameEl.textContent = getHostelName(selectedHostelId);
    selectedRoleNameEl.textContent = selectedRole;
}

function renderStaff() {
    const filteredStaff = getFilteredStaff();
    staffTable.innerHTML = "";

    filteredStaff.forEach((member) => {
        const roleClass = member.role.toLowerCase();
        const statusClass = member.status.toLowerCase();
        const row = document.createElement("tr");
        row.innerHTML = `
            <td data-label="Name" class="font-semibold text-white">${member.name}</td>
            <td data-label="Email">${member.email}</td>
            <td data-label="Phone">${member.phone}</td>
            <td data-label="Role"><span class="role-badge role-${roleClass}">${member.role}</span></td>
            <td data-label="Hostel">${getHostelName(member.hostelId)}</td>
            <td data-label="Status"><span class="status-badge status-${statusClass}">${member.status}</span></td>
            <td data-label="Actions" class="actions-cell">
                <div class="row-actions">
                    <button class="action-btn" data-action="view" data-id="${member.id}" title="View staff" aria-label="View staff">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                    <button class="action-btn" data-action="edit" data-id="${member.id}" title="Edit staff" aria-label="Edit staff">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                    </button>
                    <button class="action-btn" data-action="delete" data-id="${member.id}" title="Delete staff" aria-label="Delete staff">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path></svg>
                    </button>
                </div>
            </td>
        `;

        staffTable.appendChild(row);
    });

    updateSummary(filteredStaff);
}

function resetForm() {
    staffForm.reset();
    formError.textContent = "";
    editId = null;
    staffHostelInput.value = selectedHostelId;
    staffRoleInput.value = "Warden";
    staffStatusInput.value = "Active";
}

function openFormModal(mode, member = null) {
    resetForm();
    modalTitle.textContent = mode === "edit" ? "Edit Staff" : "Add Staff";

    if (mode === "edit" && member) {
        staffNameInput.value = member.name;
        staffEmailInput.value = member.email;
        staffPhoneInput.value = member.phone;
        staffRoleInput.value = member.role;
        staffHostelInput.value = member.hostelId;
        staffSalaryInput.value = member.salary;
        staffStatusInput.value = member.status;
        editId = member.id;
    }

    staffModal.classList.remove("hidden");
}

function closeFormModal() {
    staffModal.classList.add("hidden");
    resetForm();
}

function openDetailsModal(member) {
    detailsTitle.textContent = member.name;
    detailsContent.innerHTML = `
        <div class="detail-item"><p class="detail-label">Name</p><p class="detail-value">${member.name}</p></div>
        <div class="detail-item"><p class="detail-label">Email</p><p class="detail-value">${member.email}</p></div>
        <div class="detail-item"><p class="detail-label">Phone</p><p class="detail-value">${member.phone}</p></div>
        <div class="detail-item"><p class="detail-label">Role</p><p class="detail-value">${member.role}</p></div>
        <div class="detail-item"><p class="detail-label">Hostel</p><p class="detail-value">${getHostelName(member.hostelId)}</p></div>
        <div class="detail-item"><p class="detail-label">Status</p><p class="detail-value">${member.status}</p></div>
        <div class="detail-item sm:col-span-2"><p class="detail-label">Salary</p><p class="detail-value">PKR ${Number(member.salary).toLocaleString()}</p></div>
    `;
    detailsModal.classList.remove("hidden");
}

function closeDetailsModal() {
    detailsModal.classList.add("hidden");
}

function openConfirmModal(member) {
    deleteId = member.id;
    confirmText.textContent = `This will remove ${member.name} from ${getHostelName(member.hostelId)}.`;
    confirmModal.classList.remove("hidden");
}

function closeConfirmModal() {
    deleteId = null;
    confirmModal.classList.add("hidden");
}

function validateForm() {
    const name = staffNameInput.value.trim();
    const email = staffEmailInput.value.trim();
    const phone = staffPhoneInput.value.trim();
    const salaryRaw = staffSalaryInput.value.trim();

    if (!name || !email || !phone || !staffRoleInput.value || !staffHostelInput.value || !salaryRaw || !staffStatusInput.value) {
        return "All fields are required.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return "Enter a valid email address.";
    }

    if (Number(salaryRaw) < 0) {
        return "Salary cannot be negative.";
    }

    return "";
}

hostelFilter.addEventListener("change", (event) => {
    selectedHostelId = event.target.value;
    renderStaff();
});

roleFilter.addEventListener("change", (event) => {
    selectedRole = event.target.value;
    renderStaff();
});

[staffNameInput, staffEmailInput, staffPhoneInput, staffRoleInput, staffHostelInput, staffSalaryInput, staffStatusInput].forEach((input) => {
    input.addEventListener("input", () => {
        formError.textContent = "";
    });
    input.addEventListener("change", () => {
        formError.textContent = "";
    });
});

staffForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const error = validateForm();
    if (error) {
        formError.textContent = error;
        return;
    }

    const record = {
        id: editId || Date.now(),
        name: staffNameInput.value.trim(),
        email: staffEmailInput.value.trim(),
        phone: staffPhoneInput.value.trim(),
        role: staffRoleInput.value,
        hostelId: staffHostelInput.value,
        salary: Number(staffSalaryInput.value),
        status: staffStatusInput.value
    };

    if (editId) {
        staffMembers = staffMembers.map((member) => member.id === editId ? record : member);
    } else {
        staffMembers.unshift(record);
    }

    selectedHostelId = record.hostelId;
    selectedRole = "All";
    hostelFilter.value = selectedHostelId;
    roleFilter.value = selectedRole;
    closeFormModal();
    renderStaff();
});

staffTable.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
        return;
    }

    const member = staffMembers.find((item) => item.id === Number(button.dataset.id));
    if (!member) {
        return;
    }

    const action = button.dataset.action;

    if (action === "view") {
        openDetailsModal(member);
    } else if (action === "edit") {
        openFormModal("edit", member);
    } else if (action === "delete") {
        openConfirmModal(member);
    }
});

confirmDeleteButton.addEventListener("click", () => {
    if (deleteId === null) {
        return;
    }

    staffMembers = staffMembers.filter((member) => member.id !== deleteId);
    closeConfirmModal();
    renderStaff();
});

openStaffModalButton.addEventListener("click", () => {
    openFormModal("add");
});

sidebarToggle.addEventListener("click", handleSidebarToggle);
mobileMenuButton.addEventListener("click", openMobileSidebar);
mobileOverlay.addEventListener("click", closeMobileSidebar);
window.addEventListener("resize", handleResize);

document.querySelectorAll("[data-close-staff-modal]").forEach((button) => {
    button.addEventListener("click", closeFormModal);
});

document.querySelectorAll("[data-close-details]").forEach((button) => {
    button.addEventListener("click", closeDetailsModal);
});

document.querySelectorAll("[data-close-confirm]").forEach((button) => {
    button.addEventListener("click", closeConfirmModal);
});

[staffModal, detailsModal, confirmModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target !== modal) {
            return;
        }

        if (modal === staffModal) {
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
renderStaff();
