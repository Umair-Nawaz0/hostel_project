const modal = document.getElementById("modal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("close");

const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

// Sidebar toggle
hamburger.onclick = () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
};

overlay.onclick = () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
};

// Modal
openBtn.onclick = () => modal.style.display = "flex";
closeBtn.onclick = () => modal.style.display = "none";

let allocations = [];
const table = document.getElementById("table");

// Save
document.getElementById("save").onclick = () => {
    const student = document.getElementById("studentName").value;
    const room = document.getElementById("roomNo").value;

    if(!student || !room) return alert("Fill all fields");

    allocations.push({
        id: Date.now(),
        student,
        room,
        date: new Date().toLocaleDateString(),
        status: "Active"
    });

    modal.style.display = "none";
    render();
};

// Render
function render(){
    table.innerHTML = "";

    allocations.forEach(a => {
        table.innerHTML += `
        <tr>
            <td>${a.id}</td>
            <td>${a.student}</td>
            <td>${a.room}</td>
            <td>${a.date}</td>
            <td><span class="status ${a.status === "Active" ? "active-status" : "vacated"}">${a.status}</span></td>
            <td>
                ${a.status === "Active" ? `<button onclick="vacate(${a.id})">Vacate</button>` : ""}
            </td>
        </tr>`;
    });
}

function vacate(id){
    const a = allocations.find(a => a.id === id);
    a.status = "Vacated";
    render();
}

// Search
document.getElementById("search").oninput = function(){
    const val = this.value.toLowerCase();
    const filtered = allocations.filter(a =>
        a.student.toLowerCase().includes(val) ||
        a.room.toLowerCase().includes(val)
    );

    table.innerHTML = "";
    filtered.forEach(a => {
        table.innerHTML += `
        <tr>
            <td>${a.id}</td>
            <td>${a.student}</td>
            <td>${a.room}</td>
            <td>${a.date}</td>
            <td>${a.status}</td>
            <td></td>
        </tr>`;
    });
};

render();