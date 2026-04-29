const body = document.body;
const sidebarToggle = document.getElementById("sidebarToggle");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileOverlay = document.getElementById("mobileOverlay");
const hostelSelector = document.getElementById("hostelSelector");
const statValues = document.querySelectorAll("[data-stat]");

const hostelData = {
    hostelA: {
        name: "Hostel A",
        rooms: 48,
        students: 116,
        staff: 14,
        complaints: 26,
        pendingComplaints: 8,
        resolvedComplaints: 18,
        occupiedRooms: 41,
        availableRooms: 7,
        monthlyActivity: [22, 34, 29, 41, 38, 46]
    },
    hostelB: {
        name: "Hostel B",
        rooms: 64,
        students: 152,
        staff: 19,
        complaints: 33,
        pendingComplaints: 11,
        resolvedComplaints: 22,
        occupiedRooms: 57,
        availableRooms: 7,
        monthlyActivity: [31, 36, 40, 52, 49, 58]
    },
    hostelC: {
        name: "Hostel C",
        rooms: 36,
        students: 84,
        staff: 10,
        complaints: 14,
        pendingComplaints: 4,
        resolvedComplaints: 10,
        occupiedRooms: 29,
        availableRooms: 7,
        monthlyActivity: [14, 20, 18, 26, 24, 31]
    }
};

const globalStats = {
    totalHostels: Object.keys(hostelData).length
};

const chartLabelEls = {
    complaints: document.getElementById("complaintsChartLabel"),
    occupancy: document.getElementById("occupancyChartLabel"),
    activity: document.getElementById("activityChartLabel"),
    snapshot: document.getElementById("snapshotHostel")
};

const summaryEls = {
    occupiedSummary: document.getElementById("occupiedSummary"),
    occupancySummary: document.getElementById("occupancySummary"),
    resolvedSummary: document.getElementById("resolvedSummary"),
    resolvedRate: document.getElementById("resolvedRate"),
    staffSummary: document.getElementById("staffSummary"),
    staffStatus: document.getElementById("staffStatus")
};

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

sidebarToggle.addEventListener("click", handleSidebarToggle);
mobileMenuButton.addEventListener("click", openMobileSidebar);
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

const complaintsChart = new Chart(document.getElementById("complaintsChart"), {
    type: "doughnut",
    data: {
        labels: ["Pending", "Resolved"],
        datasets: [{
            data: [0, 0],
            backgroundColor: ["#f59e0b", "#22c55e"],
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
        labels: ["Occupied", "Available"],
        datasets: [{
            data: [0, 0],
            backgroundColor: ["#38bdf8", "#8b5cf6"],
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
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{
            label: "Monthly Activity",
            data: [0, 0, 0, 0, 0, 0],
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
                    stepSize: 10
                }
            }
        },
        animation: {
            duration: 1000
        }
    }
});

function updateTrends(data) {
    document.getElementById("roomsTrend").textContent = `${data.occupiedRooms}/${data.rooms}`;
    document.getElementById("studentsTrend").textContent = `${Math.round((data.students / data.rooms) * 10) / 10} / room`;
    document.getElementById("staffTrend").textContent = `${data.staff} active`;
    document.getElementById("complaintsTrend").textContent = `${data.resolvedComplaints} resolved`;
    document.getElementById("pendingTrend").textContent = `${data.pendingComplaints} open`;
}

function updateSummaries(data) {
    const occupancyPercent = Math.round((data.occupiedRooms / data.rooms) * 100);
    const resolvedPercent = Math.round((data.resolvedComplaints / data.complaints) * 100);

    summaryEls.occupiedSummary.textContent = `${data.occupiedRooms} rooms in use`;
    summaryEls.occupancySummary.textContent = `${occupancyPercent}%`;
    summaryEls.resolvedSummary.textContent = `${data.resolvedComplaints} completed items`;
    summaryEls.resolvedRate.textContent = `${resolvedPercent}%`;
    summaryEls.staffSummary.textContent = `${data.staff} staff scheduled`;
    summaryEls.staffStatus.textContent = "Live";
}

function updateCharts(data) {
    complaintsChart.data.datasets[0].data = [data.pendingComplaints, data.resolvedComplaints];
    complaintsChart.update();

    occupancyChart.data.datasets[0].data = [data.occupiedRooms, data.availableRooms];
    occupancyChart.update();

    activityChart.data.datasets[0].data = data.monthlyActivity;
    activityChart.update();
}

function updateLabels(data) {
    chartLabelEls.complaints.textContent = data.name;
    chartLabelEls.occupancy.textContent = data.name;
    chartLabelEls.activity.textContent = data.name;
    chartLabelEls.snapshot.textContent = data.name;
}

function updateStats(data) {
    const statMap = {
        totalHostels: globalStats.totalHostels,
        rooms: data.rooms,
        students: data.students,
        staff: data.staff,
        complaints: data.complaints,
        pendingComplaints: data.pendingComplaints
    };

    statValues.forEach((element) => {
        const key = element.dataset.stat;
        animateValue(element, statMap[key]);
    });
}

function renderDashboard(hostelKey) {
    const data = hostelData[hostelKey];
    updateStats(data);
    updateTrends(data);
    updateSummaries(data);
    updateLabels(data);
    updateCharts(data);
}

hostelSelector.addEventListener("change", (event) => {
    renderDashboard(event.target.value);
});

handleResize();
renderDashboard(hostelSelector.value);
