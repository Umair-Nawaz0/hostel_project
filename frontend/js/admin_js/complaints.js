const body = document.body;
const sidebarToggle = document.getElementById("sidebarToggle");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");

const hostelFilter = document.getElementById("hostelFilter");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchInput");
const complaintsTable = document.getElementById("complaintsTable");

const filteredComplaintsEl = document.getElementById("filteredComplaints");
const pendingCountEl = document.getElementById("pendingCount");
const selectedHostelNameEl = document.getElementById("selectedHostelName");
const selectedStatusNameEl = document.getElementById("selectedStatusName");

const detailsModal = document.getElementById("detailsModal");
const detailsTitle = document.getElementById("detailsTitle");
const detailsContent = document.getElementById("detailsContent");

const hostels = [
    { id: "hostelA", name: "Hostel A" },
    { id: "hostelB", name: "Hostel B" },
    { id: "hostelC", name: "Hostel C" }
];

let complaints = [
    {
        id: "CMP-1001",
        studentName: "Ali Raza",
        hostelId: "hostelA",
        description: "Water leakage in washroom near Room A-101 causing floor to stay wet throughout the day.",
        date: "2025-05-02",
        status: "Pending"
    },
    {
        id: "CMP-1002",
        studentName: "Sara Khan",
        hostelId: "hostelA",
        description: "Ceiling fan in Room A-203 stops randomly and makes a loud noise while running.",
        date: "2025-05-04",
        status: "In Progress"
    },
    {
        id: "CMP-1003",
        studentName: "Usman Tariq",
        hostelId: "hostelB",
        description: "Wi-Fi signal in the second floor corridor and adjacent rooms has been unstable for three days.",
        date: "2025-05-05",
        status: "Resolved"
    },
    {
        id: "CMP-1004",
        studentName: "Hina Malik",
        hostelId: "hostelB",
        description: "Mess food quality has dropped and dinner was served cold on multiple occasions this week.",
        date: "2025-05-07",
        status: "Pending"
    },
    {
        id: "CMP-1005",
        studentName: "Ahmed Noor",
        hostelId: "hostelC",
        description: "Main corridor lights on the first floor are flickering and sometimes remain off at night.",
        date: "2025-05-08",
        status: "In Progress"
    }
];

let selectedHostelId = hostels[0].id;
let selectedStatus = "All";

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
    hostelFilter.value = selectedHostelId;
}

function getHostelName(hostelId) {
    return hostels.find((hostel) => hostel.id === hostelId)?.name || "Unknown Hostel";
}

function getFilteredComplaints() {
    const query = searchInput.value.trim().toLowerCase();

    return complaints.filter((complaint) => {
        const matchesHostel = complaint.hostelId === selectedHostelId;
        const matchesStatus = selectedStatus === "All" || complaint.status === selectedStatus;
        const matchesSearch = !query
            || complaint.studentName.toLowerCase().includes(query)
            || complaint.description.toLowerCase().includes(query)
            || complaint.id.toLowerCase().includes(query);

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

function updateSummary(filteredComplaints) {
    const pendingCount = filteredComplaints.filter((complaint) => complaint.status === "Pending").length;
    animateCounter(filteredComplaintsEl, filteredComplaints.length);
    animateCounter(pendingCountEl, pendingCount);
    selectedHostelNameEl.textContent = getHostelName(selectedHostelId);
    selectedStatusNameEl.textContent = selectedStatus;
}

function renderComplaints() {
    const filteredComplaints = getFilteredComplaints();
    complaintsTable.innerHTML = "";

    filteredComplaints.forEach((complaint) => {
        const statusClass = complaint.status.toLowerCase().replace(/\s+/g, "-");
        const preview = complaint.description.length > 70
            ? `${complaint.description.slice(0, 70)}...`
            : complaint.description;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="font-semibold text-white">${complaint.id}</td>
            <td>${complaint.studentName}</td>
            <td>${getHostelName(complaint.hostelId)}</td>
            <td>${preview}</td>
            <td>${complaint.date}</td>
            <td><span class="status-badge status-${statusClass}">${complaint.status}</span></td>
            <td>
                <button class="action-btn" data-id="${complaint.id}">View Details</button>
            </td>
        `;

        complaintsTable.appendChild(row);
    });

    updateSummary(filteredComplaints);
}

function openDetailsModal(complaint) {
    detailsTitle.textContent = complaint.id;
    detailsContent.innerHTML = `
        <div class="detail-item"><p class="detail-label">Complaint ID</p><p class="detail-value">${complaint.id}</p></div>
        <div class="detail-item"><p class="detail-label">Student Name</p><p class="detail-value">${complaint.studentName}</p></div>
        <div class="detail-item"><p class="detail-label">Hostel</p><p class="detail-value">${getHostelName(complaint.hostelId)}</p></div>
        <div class="detail-item"><p class="detail-label">Date</p><p class="detail-value">${complaint.date}</p></div>
        <div class="detail-item sm:col-span-2"><p class="detail-label">Status</p><p class="detail-value">${complaint.status}</p></div>
        <div class="detail-item sm:col-span-2"><p class="detail-label">Full Description</p><p class="detail-value">${complaint.description}</p></div>
    `;
    detailsModal.classList.remove("hidden");
}

function closeDetailsModal() {
    detailsModal.classList.add("hidden");
}

hostelFilter.addEventListener("change", (event) => {
    selectedHostelId = event.target.value;
    renderComplaints();
});

statusFilter.addEventListener("change", (event) => {
    selectedStatus = event.target.value;
    renderComplaints();
});

searchInput.addEventListener("input", () => {
    renderComplaints();
});

complaintsTable.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (!button) {
        return;
    }

    const complaint = complaints.find((item) => item.id === button.dataset.id);
    if (!complaint) {
        return;
    }

    openDetailsModal(complaint);
});

sidebarToggle.addEventListener("click", handleSidebarToggle);
mobileMenuButton.addEventListener("click", openMobileSidebar);
mobileOverlay.addEventListener("click", closeMobileSidebar);
window.addEventListener("resize", handleResize);

document.querySelectorAll("[data-close-details]").forEach((button) => {
    button.addEventListener("click", closeDetailsModal);
});

detailsModal.addEventListener("click", (event) => {
    if (event.target === detailsModal) {
        closeDetailsModal();
    }
});

handleResize();
populateHostelOptions();
renderComplaints();
