const API_URL = "http://localhost:5000/api/dashboard";

const body = document.body;
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");
const hostelSelector = document.getElementById("hostelSelector");
const statValues = document.querySelectorAll("[data-stat]");

const chartLabelEls = {
    capacity: document.getElementById("capacityChartLabel"),
    occupancy: document.getElementById("occupancyChartLabel"),
    activity: document.getElementById("activityChartLabel"),
    snapshot: document.getElementById("snapshotHostel")
};

const summaryEls = {
    occupiedSummary: document.getElementById("occupiedSummary"),
    availableSummary: document.getElementById("availableSummary"),
    allocationIntensity: document.getElementById("allocationIntensity"),
    allocationSummary: document.getElementById("allocationSummary"),
    studentsPerRoom: document.getElementById("studentsPerRoom"),
    staffSummary: document.getElementById("staffSummary"),
    staffStatus: document.getElementById("staffStatus")
};

const trendEls = {
    roomsTrend: document.getElementById("roomsTrend"),
    studentsTrend: document.getElementById("studentsTrend"),
    staffTrend: document.getElementById("staffTrend"),
    allocationsTrend: document.getElementById("allocationsTrend"),
    availabilityTrend: document.getElementById("availabilityTrend")
};

let dashboardData = {
    overview: null,
    hostels: [],
    monthLabels: [],
    selectedHostel: null
};

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

mobileMenuButton.addEventListener("click", toggleSidebar);
mobileOverlay.addEventListener("click", closeMobileSidebar);
window.addEventListener("resize", handleResize);

function animateValue(element, target) {
    const duration = 900;
    const start = Number(element.textContent.replace(/,/g, "")) || 0;
    const startTime = performance.now();

    function update(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);
        element.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

Chart.defaults.color = "#94a3b8";
Chart.defaults.borderColor = "rgba(148, 163, 184, 0.12)";
Chart.defaults.font.family = "Space Grotesk, sans-serif";

const capacityChart = new Chart(document.getElementById("capacityChart"), {
    type: "doughnut",
    data: {
        labels: ["Occupied Rooms", "Available Rooms"],
        datasets: [{
            data: [0, 0],
            backgroundColor: ["#06b6d4", "#8b5cf6"],
            borderWidth: 0,
            hoverOffset: 6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    usePointStyle: true,
                    pointStyle: "circle",
                    padding: 18
                }
            }
        },
        animation: {
            duration: 900
        }
    }
});

const occupancyChart = new Chart(document.getElementById("occupancyChart"), {
    type: "bar",
    data: {
        labels: ["Students", "Staff"],
        datasets: [{
            data: [0, 0],
            backgroundColor: ["#38bdf8", "#22c55e"],
            borderRadius: 14,
            borderSkipped: false,
            maxBarThickness: 42
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 10
                }
            }
        },
        animation: {
            duration: 900
        }
    }
});

const activityChart = new Chart(document.getElementById("activityChart"), {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            label: "Monthly Activity",
            data: [],
            borderColor: "#22d3ee",
            backgroundColor: "rgba(34, 211, 238, 0.14)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "#22d3ee"
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        },
        animation: {
            duration: 1000
        }
    }
});

function setStatusState(message) {
    trendEls.roomsTrend.textContent = message;
    trendEls.studentsTrend.textContent = message;
    trendEls.staffTrend.textContent = message;
    trendEls.allocationsTrend.textContent = message;
    trendEls.availabilityTrend.textContent = message;
    summaryEls.occupiedSummary.textContent = message;
    summaryEls.availableSummary.textContent = message;
    summaryEls.allocationIntensity.textContent = message;
    summaryEls.allocationSummary.textContent = message;
    summaryEls.studentsPerRoom.textContent = message;
    summaryEls.staffSummary.textContent = message;
    summaryEls.staffStatus.textContent = message;
    chartLabelEls.capacity.textContent = message;
    chartLabelEls.occupancy.textContent = message;
    chartLabelEls.activity.textContent = message;
    chartLabelEls.snapshot.textContent = message;
}

async function fetchDashboardData(hostelId = "") {
    const requestUrl = hostelId ? `${API_URL}?hostelId=${encodeURIComponent(hostelId)}` : API_URL;
    const response = await fetch(requestUrl);
    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload.message || "Failed to fetch dashboard analytics.");
    }

    return {
        overview: payload.data.overview,
        hostels: Array.isArray(payload.data.hostels) ? payload.data.hostels : [],
        monthLabels: Array.isArray(payload.data.month_labels) ? payload.data.month_labels : [],
        selectedHostel: payload.data.selected_hostel || null,
        selectedHostelId: payload.data.selected_hostel_id ?? null
    };
}

function populateHostelSelector(hostels) {
    hostelSelector.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All Hostels";
    hostelSelector.appendChild(allOption);

    if (hostels.length === 0) {
      hostelSelector.innerHTML = '<option value="">No hostels available</option>';
      return;
    }

    hostels.forEach((hostel) => {
        const option = document.createElement("option");
        option.value = String(hostel.hostel_id);
        option.textContent = hostel.hostel_name;
        hostelSelector.appendChild(option);
    });
}

function updateOverviewStats(overview) {
    statValues.forEach((element) => {
        const key = element.dataset.stat;
        animateValue(element, Number(overview[key] || 0));
    });
}

function updateTrends(hostel) {
    trendEls.roomsTrend.textContent = `${hostel.occupied_rooms}/${hostel.total_rooms}`;
    trendEls.studentsTrend.textContent = hostel.total_rooms > 0
        ? `${(hostel.total_students / hostel.total_rooms).toFixed(1)} / room`
        : "0 / room";
    trendEls.staffTrend.textContent = `${hostel.total_staff} active`;
    trendEls.allocationsTrend.textContent = `${hostel.active_allocations} live`;
    trendEls.availabilityTrend.textContent = `${hostel.available_rooms} open`;
}

function updateSummaries(hostel) {
    const occupancyPercent = hostel.total_rooms > 0
        ? Math.round((hostel.occupied_rooms / hostel.total_rooms) * 100)
        : 0;
    const allocationIntensity = hostel.total_rooms > 0
        ? Math.round((hostel.active_allocations / hostel.total_rooms) * 100)
        : 0;
    const studentsPerOccupiedRoom = hostel.occupied_rooms > 0
        ? (hostel.total_students / hostel.occupied_rooms).toFixed(1)
        : 0;

    summaryEls.occupiedSummary.textContent = `${hostel.occupied_rooms} rooms in use`;
    summaryEls.availableSummary.textContent = `${hostel.available_rooms} ready`;
    summaryEls.allocationIntensity.textContent = `${allocationIntensity}%`;
    summaryEls.allocationSummary.textContent = `${hostel.active_allocations} active`;
    summaryEls.studentsPerRoom.textContent = `${studentsPerOccupiedRoom}`;
    summaryEls.staffSummary.textContent = `${hostel.total_staff} staff scheduled`;
    summaryEls.staffStatus.textContent = occupancyPercent > 85 ? "Tight" : "Balanced";
}

function updateCharts(hostel) {
    capacityChart.data.datasets[0].data = [
        hostel.occupied_rooms,
        hostel.available_rooms
    ];
    capacityChart.update();

    occupancyChart.data.datasets[0].data = [
        hostel.total_students,
        hostel.total_staff
    ];
    occupancyChart.update();

    activityChart.data.labels = dashboardData.monthLabels;
    activityChart.data.datasets[0].data = hostel.monthly_activity;
    activityChart.update();
}

function updateLabels(hostel) {
    chartLabelEls.capacity.textContent = hostel.hostel_name;
    chartLabelEls.occupancy.textContent = hostel.hostel_name;
    chartLabelEls.activity.textContent = hostel.hostel_name;
    chartLabelEls.snapshot.textContent = hostel.hostel_name;
}

function renderSelectedHostel() {
    const hostel = dashboardData.selectedHostel;

    if (!hostel) {
        setStatusState("No data available");
        return;
    }

    updateTrends(hostel);
    updateSummaries(hostel);
    updateLabels(hostel);
    updateCharts(hostel);
}

async function loadDashboard(hostelId = "") {
    setStatusState("Loading...");

    try {
        dashboardData = await fetchDashboardData(hostelId);
        updateOverviewStats(dashboardData.overview || {});
        
        if (!hostelSelector.dataset.initialized) {
            populateHostelSelector(dashboardData.hostels);
            hostelSelector.dataset.initialized = "true";
        }

        hostelSelector.value = dashboardData.selectedHostelId ? String(dashboardData.selectedHostelId) : "";

        if (dashboardData.hostels.length === 0) {
            setStatusState("No hostels available");
            return;
        }

        renderSelectedHostel();
    } catch (error) {
        setStatusState(error.message);
        hostelSelector.innerHTML = '<option value="">Unable to load</option>';
    }
}

hostelSelector.addEventListener("change", (event) => {
    void loadDashboard(event.target.value);
});

handleResize();
void loadDashboard();
