const modal = document.getElementById("modal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("close");

const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

let complaints = [];
const table = document.getElementById("table");

// Sidebar
hamburger.onclick = () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
};

overlay.onclick = () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
};

// Modal open
openBtn.onclick = () => {
    modal.style.display = "flex";
    clearForm();
};

// Modal close
closeBtn.onclick = () => modal.style.display = "none";

// Close outside
window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
};

// Save
document.getElementById("save").onclick = () => {

    const student = document.getElementById("student").value.trim();
    const text = document.getElementById("complaintText").value.trim();

    if(!student || !text){
        alert("Please fill all fields");
        return;
    }

    complaints.push({
        id: Date.now(),
        student,
        text,
        date: new Date().toLocaleDateString(),
        status: "Pending"
    });

    modal.style.display = "none";
    render();
};

// Render
function render(data = complaints){
    table.innerHTML = "";

    data.forEach(c => {
        table.innerHTML += `
        <tr>
            <td>${c.id}</td>
            <td>${c.student}</td>
            <td>${c.text}</td>
            <td>${c.date}</td>
            <td><span class="status ${c.status.toLowerCase()}">${c.status}</span></td>
            <td>
                ${c.status === "Pending" ? `<button class="btn resolve" onclick="resolveComplaint(${c.id})">Resolve</button>` : ""}
                <button class="btn delete" onclick="deleteComplaint(${c.id})">Delete</button>
            </td>
        </tr>`;
    });
}

// Resolve
function resolveComplaint(id){
    const c = complaints.find(c => c.id === id);
    if(c){
        c.status = "Resolved";
        render();
    }
}

// Delete
function deleteComplaint(id){
    complaints = complaints.filter(c => c.id !== id);
    render();
}

// Search
document.getElementById("search").oninput = function(){
    const val = this.value.toLowerCase();
    const filtered = complaints.filter(c =>
        c.student.toLowerCase().includes(val) ||
        c.text.toLowerCase().includes(val)
    );
    render(filtered);
};

// Clear form
function clearForm(){
    document.getElementById("student").value = "";
    document.getElementById("complaintText").value = "";
}

render();