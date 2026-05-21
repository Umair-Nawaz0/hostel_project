const API = {
    hostels: "http://localhost:5000/api/hostels",
    students: "http://localhost:5000/api/students",
    payments: "http://localhost:5000/api/payments"
};

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

let hostels = [];
let students = [];
let payments = [];
let selectedHostelId = "";
let selectedStatus = "All";

const request = async (url, options = {}) => {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "Request failed.");
    return payload;
};

const animate = (element, target, currency = false) => {
    const start = Number(element.textContent.replace(/[^\d]/g, "")) || 0;
    const startTime = performance.now();
    const duration = 700;
    const update = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(start + (target - start) * eased);
        element.textContent = currency ? `PKR ${value.toLocaleString()}` : value.toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
};

const safeText = (value, fallback = "Not Available") => {
    const normalized = typeof value === "string" ? value.trim() : value;
    return normalized ? normalized : fallback;
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

const openMobileSidebar = () => {
    body.classList.add("sidebar-open");
    mobileOverlay.classList.add("active");
};

const closeMobileSidebar = () => {
    body.classList.remove("sidebar-open");
    mobileOverlay.classList.remove("active");
};

const normalizeStudent = (row) => ({
    id: Number(row.student_id || row.id),
    name: safeText(row.full_name || row.name, "Unnamed Student"),
    hostelId: row.hostel_id ? Number(row.hostel_id) : null,
    hostel: safeText(row.hostel_name || row.hostel, "Unassigned Hostel")
});

const normalizePayment = (row) => ({
    id: Number(row.payment_id || row.id),
    studentId: Number(row.student_id || row.studentId),
    studentName: safeText(row.student_name || row.studentName, "Unknown Student"),
    hostelId: row.hostel_id ? Number(row.hostel_id) : null,
    hostel: safeText(row.hostel_name || row.hostelName || row.hostel, "Unassigned Hostel"),
    amount: Number(row.amount || 0),
    date: safeText(row.payment_date || row.date),
    status: safeText(row.status, "Pending")
});

const populateHostels = () => {
    hostelFilter.innerHTML = [`<option value="">All Hostels</option>`]
        .concat(hostels.map((hostel) => `<option value="${hostel.id}">${hostel.name}</option>`))
        .join("");
    hostelFilter.value = selectedHostelId;
};

const populateStudents = () => {
    const scopedStudents = selectedHostelId
        ? students.filter((student) => student.hostelId === Number(selectedHostelId))
        : students;
    studentSelect.innerHTML = scopedStudents.map((student) => (
        `<option value="${student.id}">${student.name} • ${student.hostel}</option>`
    )).join("");
};

const getFilteredPayments = () => {
    const query = searchInput.value.trim().toLowerCase();
    return payments.filter((payment) => {
        const matchesStatus = selectedStatus === "All" || payment.status === selectedStatus;
        const matchesSearch = !query || payment.studentName.toLowerCase().includes(query);
        return matchesStatus && matchesSearch;
    });
};

const render = () => {
    const rows = getFilteredPayments();
    paymentsTable.innerHTML = "";
    if (!rows.length) {
        paymentsTable.innerHTML = `<tr><td colspan="7" class="py-10 text-center text-slate-400">No payments found for the selected filters.</td></tr>`;
    } else {
        rows.forEach((payment) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="font-semibold text-white">${payment.id}</td>
                <td>${payment.studentName}</td>
                <td>${payment.hostel}</td>
                <td>PKR ${payment.amount.toLocaleString()}</td>
                <td>${payment.date}</td>
                <td><span class="status-badge status-${payment.status.toLowerCase().replace(/\s+/g, "-")}">${payment.status}</span></td>
                <td><button class="action-btn" data-id="${payment.id}">View Details</button></td>
            `;
            paymentsTable.appendChild(row);
        });
    }
    animate(totalPaymentsEl, rows.length);
    animate(totalPaidAmountEl, rows.filter((payment) => payment.status === "Paid").reduce((sum, payment) => sum + payment.amount, 0), true);
    animate(pendingPaymentsEl, rows.filter((payment) => payment.status === "Pending" || payment.status === "Unpaid").length);
};

const resetForm = () => {
    paymentForm.reset();
    formError.textContent = "";
    formError.classList.add("hidden");
    populateStudents();
    paymentStatusInput.value = "Paid";
    modalTitle.textContent = "Add Payment";
};

const openPaymentModal = () => {
    resetForm();
    paymentModal.classList.remove("hidden");
};

const closePaymentModal = () => {
    paymentModal.classList.add("hidden");
    resetForm();
};

const closeDetailsModal = () => detailsModal.classList.add("hidden");

const openDetails = (payment) => {
    detailsTitle.textContent = `Payment #${payment.id}`;
    detailsContent.innerHTML = `
        <div class="detail-item"><p class="detail-label">Payment ID</p><p class="detail-value">${payment.id}</p></div>
        <div class="detail-item"><p class="detail-label">Student Name</p><p class="detail-value">${payment.studentName}</p></div>
        <div class="detail-item"><p class="detail-label">Hostel</p><p class="detail-value">${payment.hostel}</p></div>
        <div class="detail-item"><p class="detail-label">Amount</p><p class="detail-value">PKR ${payment.amount.toLocaleString()}</p></div>
        <div class="detail-item"><p class="detail-label">Date</p><p class="detail-value">${payment.date}</p></div>
        <div class="detail-item"><p class="detail-label">Status</p><p class="detail-value">${payment.status}</p></div>
    `;
    detailsModal.classList.remove("hidden");
};

const loadPayments = async () => {
    const payload = await request(buildUrl(API.payments, {
        hostelId: selectedHostelId,
        status: selectedStatus === "All" ? "" : selectedStatus
    }));
    payments = (payload.data || []).map(normalizePayment);
    render();
};

const loadPageData = async () => {
    paymentsTable.innerHTML = `<tr><td colspan="7" class="py-10 text-center text-slate-400">Loading payments...</td></tr>`;
    try {
        if (!hostels.length) {
            const [hostelsPayload, studentsPayload] = await Promise.all([
                request(API.hostels),
                request(API.students)
            ]);
            hostels = (hostelsPayload.data || []).map((row) => ({
                id: Number(row.hostel_id),
                name: safeText(row.hostel_name, "Unnamed Hostel")
            }));
            students = (studentsPayload.data || []).map(normalizeStudent);
            populateHostels();
        }
        populateStudents();
        await loadPayments();
    } catch (error) {
        paymentsTable.innerHTML = `<tr><td colspan="7" class="py-10 text-center text-slate-400">${error.message}</td></tr>`;
    }
};

hostelFilter.addEventListener("change", async (event) => {
    selectedHostelId = event.target.value;
    populateStudents();
    await loadPayments();
});

statusFilter.addEventListener("change", async (event) => {
    selectedStatus = event.target.value;
    await loadPayments();
});

searchInput.addEventListener("input", render);

paymentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!studentSelect.value || !paymentAmountInput.value || !paymentDateInput.value) {
        formError.textContent = "All fields are required.";
        formError.classList.remove("hidden");
        return;
    }
    try {
        await request(API.payments, {
            method: "POST",
            body: JSON.stringify({
                student_id: Number(studentSelect.value),
                amount: Number(paymentAmountInput.value),
                payment_date: paymentDateInput.value,
                status: paymentStatusInput.value,
                due_date: paymentDateInput.value,
                month_year: paymentDateInput.value.slice(0, 7)
            })
        });
        window.alert("Payment added successfully.");
        closePaymentModal();
        await loadPageData();
    } catch (error) {
        formError.textContent = error.message;
        formError.classList.remove("hidden");
    }
});

paymentsTable.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (!button) return;
    const payment = payments.find((item) => String(item.id) === button.dataset.id);
    if (payment) openDetails(payment);
});

openPaymentModalButton.addEventListener("click", openPaymentModal);
mobileMenuButton.addEventListener("click", () => body.classList.contains("sidebar-open") ? closeMobileSidebar() : openMobileSidebar());
mobileOverlay.addEventListener("click", closeMobileSidebar);
window.addEventListener("resize", closeMobileSidebar);
document.querySelectorAll("[data-close-payment-modal]").forEach((button) => button.addEventListener("click", closePaymentModal));
document.querySelectorAll("[data-close-details]").forEach((button) => button.addEventListener("click", closeDetailsModal));
[paymentModal, detailsModal].forEach((modal) => modal.addEventListener("click", (event) => {
    if (event.target !== modal) return;
    if (modal === paymentModal) closePaymentModal();
    else closeDetailsModal();
}));

closeMobileSidebar();
void loadPageData();
