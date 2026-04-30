const body = document.body;
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");

const hostelFilter = document.getElementById("hostelFilter");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchInput");
const paymentsTable = document.getElementById("paymentsTable");

const totalPaymentsEl = document.getElementById("totalPayments");
const totalPaidAmountEl = document.getElementById("totalPaidAmount");
const pendingPaymentsEl = document.getElementById("pendingPayments");

const openPaymentModalButton = document.getElementById("openPaymentModal");
const paymentModal = document.getElementById("paymentModal");
const detailsModal = document.getElementById("detailsModal");
const paymentForm = document.getElementById("paymentForm");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");

const studentSelect = document.getElementById("studentSelect");
const paymentAmountInput = document.getElementById("paymentAmount");
const paymentDateInput = document.getElementById("paymentDate");
const paymentStatusInput = document.getElementById("paymentStatus");

const detailsTitle = document.getElementById("detailsTitle");
const detailsContent = document.getElementById("detailsContent");

const hostels = [
    { id: "hostelA", name: "Hostel A" },
    { id: "hostelB", name: "Hostel B" },
    { id: "hostelC", name: "Hostel C" }
];

const students = [
    { id: "stu1", name: "Ali Raza", hostelId: "hostelA" },
    { id: "stu2", name: "Sara Khan", hostelId: "hostelA" },
    { id: "stu3", name: "Usman Tariq", hostelId: "hostelB" },
    { id: "stu4", name: "Hina Malik", hostelId: "hostelB" },
    { id: "stu5", name: "Ahmed Noor", hostelId: "hostelC" }
];

let payments = [
    { id: "PAY-1001", studentId: "stu1", amount: 18000, date: "2025-05-01", status: "Paid" },
    { id: "PAY-1002", studentId: "stu2", amount: 18000, date: "2025-05-03", status: "Pending" },
    { id: "PAY-1003", studentId: "stu3", amount: 22000, date: "2025-05-04", status: "Unpaid" },
    { id: "PAY-1004", studentId: "stu4", amount: 22000, date: "2025-05-06", status: "Paid" },
    { id: "PAY-1005", studentId: "stu5", amount: 16000, date: "2025-05-08", status: "Pending" }
];

let selectedHostelId = hostels[0].id;
let selectedStatus = "All";

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

function populateHostelOptions() {
    const options = hostels.map((hostel) => `<option value="${hostel.id}">${hostel.name}</option>`).join("");
    hostelFilter.innerHTML = options;
    hostelFilter.value = selectedHostelId;
}

function populateStudentOptions() {
    const options = students.map((student) => {
        const hostelName = getHostelName(student.hostelId);
        return `<option value="${student.id}">${student.name} • ${hostelName}</option>`;
    }).join("");
    studentSelect.innerHTML = options;
}

function getHostelName(hostelId) {
    return hostels.find((hostel) => hostel.id === hostelId)?.name || "Unknown Hostel";
}

function getStudent(studentId) {
    return students.find((student) => student.id === studentId);
}

function getFilteredPayments() {
    const query = searchInput.value.trim().toLowerCase();

    return payments.filter((payment) => {
        const student = getStudent(payment.studentId);
        const matchesHostel = student?.hostelId === selectedHostelId;
        const matchesStatus = selectedStatus === "All" || payment.status === selectedStatus;
        const matchesSearch = !query || student?.name.toLowerCase().includes(query);
        return matchesHostel && matchesStatus && matchesSearch;
    });
}

function animateCounter(element, target, prefix = "", isCurrency = false) {
    const currentText = element.textContent.replace(/[^\d]/g, "");
    const start = Number(currentText) || 0;
    const startTime = performance.now();
    const duration = 700;

    function update(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(start + (target - start) * eased);
        const formatted = isCurrency ? `PKR ${value.toLocaleString()}` : `${prefix}${value.toLocaleString()}`;
        element.textContent = formatted;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function updateSummary(filteredPayments) {
    const paidAmount = filteredPayments
        .filter((payment) => payment.status === "Paid")
        .reduce((sum, payment) => sum + payment.amount, 0);
    const pendingCount = filteredPayments.filter((payment) => payment.status === "Pending").length;

    animateCounter(totalPaymentsEl, filteredPayments.length);
    animateCounter(totalPaidAmountEl, paidAmount, "", true);
    animateCounter(pendingPaymentsEl, pendingCount);
}

function renderPayments() {
    const filteredPayments = getFilteredPayments();
    paymentsTable.innerHTML = "";

    filteredPayments.forEach((payment) => {
        const student = getStudent(payment.studentId);
        const statusClass = payment.status.toLowerCase();
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="font-semibold text-white">${payment.id}</td>
            <td>${student?.name || "Unknown Student"}</td>
            <td>${getHostelName(student?.hostelId)}</td>
            <td>PKR ${payment.amount.toLocaleString()}</td>
            <td>${payment.date}</td>
            <td><span class="status-badge status-${statusClass}">${payment.status}</span></td>
            <td>
                <button class="action-btn" data-id="${payment.id}">View Details</button>
            </td>
        `;

        paymentsTable.appendChild(row);
    });

    updateSummary(filteredPayments);
}

function resetForm() {
    paymentForm.reset();
    formError.textContent = "";
    if (students.length > 0) {
        studentSelect.value = students[0].id;
    }
    paymentStatusInput.value = "Paid";
}

function openPaymentModal() {
    resetForm();
    modalTitle.textContent = "Add Payment";
    paymentModal.classList.remove("hidden");
}

function closePaymentModal() {
    paymentModal.classList.add("hidden");
    resetForm();
}

function openDetailsModal(payment) {
    const student = getStudent(payment.studentId);
    detailsTitle.textContent = payment.id;
    detailsContent.innerHTML = `
        <div class="detail-item"><p class="detail-label">Payment ID</p><p class="detail-value">${payment.id}</p></div>
        <div class="detail-item"><p class="detail-label">Student Name</p><p class="detail-value">${student?.name || "Unknown Student"}</p></div>
        <div class="detail-item"><p class="detail-label">Hostel</p><p class="detail-value">${getHostelName(student?.hostelId)}</p></div>
        <div class="detail-item"><p class="detail-label">Amount</p><p class="detail-value">PKR ${payment.amount.toLocaleString()}</p></div>
        <div class="detail-item"><p class="detail-label">Date</p><p class="detail-value">${payment.date}</p></div>
        <div class="detail-item"><p class="detail-label">Status</p><p class="detail-value">${payment.status}</p></div>
    `;
    detailsModal.classList.remove("hidden");
}

function closeDetailsModal() {
    detailsModal.classList.add("hidden");
}

function validateForm() {
    const amountRaw = paymentAmountInput.value.trim();
    const date = paymentDateInput.value.trim();

    if (!studentSelect.value || !amountRaw || !date || !paymentStatusInput.value) {
        return "All fields are required.";
    }

    if (Number(amountRaw) < 0) {
        return "Amount cannot be negative.";
    }

    return "";
}

hostelFilter.addEventListener("change", (event) => {
    selectedHostelId = event.target.value;
    renderPayments();
});

statusFilter.addEventListener("change", (event) => {
    selectedStatus = event.target.value;
    renderPayments();
});

searchInput.addEventListener("input", () => {
    renderPayments();
});

[paymentAmountInput, paymentDateInput, paymentStatusInput, studentSelect].forEach((input) => {
    input.addEventListener("input", () => {
        formError.textContent = "";
    });
    input.addEventListener("change", () => {
        formError.textContent = "";
    });
});

paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const error = validateForm();
    if (error) {
        formError.textContent = error;
        return;
    }

    const newPayment = {
        id: `PAY-${Date.now()}`,
        studentId: studentSelect.value,
        amount: Number(paymentAmountInput.value),
        date: paymentDateInput.value,
        status: paymentStatusInput.value
    };

    payments.unshift(newPayment);
    selectedHostelId = getStudent(newPayment.studentId)?.hostelId || selectedHostelId;
    selectedStatus = "All";
    hostelFilter.value = selectedHostelId;
    statusFilter.value = selectedStatus;
    closePaymentModal();
    renderPayments();
});

paymentsTable.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (!button) {
        return;
    }

    const payment = payments.find((item) => item.id === button.dataset.id);
    if (!payment) {
        return;
    }

    openDetailsModal(payment);
});

openPaymentModalButton.addEventListener("click", openPaymentModal);

mobileMenuButton.addEventListener("click", toggleSidebar);
mobileOverlay.addEventListener("click", closeMobileSidebar);
window.addEventListener("resize", handleResize);

document.querySelectorAll("[data-close-payment-modal]").forEach((button) => {
    button.addEventListener("click", closePaymentModal);
});

document.querySelectorAll("[data-close-details]").forEach((button) => {
    button.addEventListener("click", closeDetailsModal);
});

[paymentModal, detailsModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target !== modal) {
            return;
        }

        if (modal === paymentModal) {
            closePaymentModal();
        } else {
            closeDetailsModal();
        }
    });
});

handleResize();
populateHostelOptions();
populateStudentOptions();
renderPayments();
