const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

// Open sidebar
hamburger.addEventListener("click", () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
});

// Close sidebar
overlay.addEventListener("click", () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
});

// Dummy stats
const stats = {
    students: 120,
    rooms: 50,
    available: 20,
    complaints: 6
};

Object.keys(stats).forEach(id => {
    document.getElementById(id).textContent = stats[id];
});

// Table data
const complaints = [
    { id: 1, name: "Ali", issue: "Water", status: "Open" },
    { id: 2, name: "Ahmed", issue: "Electricity", status: "Resolved" },
    { id: 3, name: "Usman", issue: "WiFi", status: "Pending" }
];

const table = document.getElementById("tableData");

complaints.forEach(c => {
    table.innerHTML += `
        <tr>
            <td>${c.id}</td>
            <td>${c.name}</td>
            <td>${c.issue}</td>
            <td>${c.status}</td>
        </tr>
    `;
});