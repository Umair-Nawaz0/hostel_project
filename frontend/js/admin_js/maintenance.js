const modal = document.getElementById("modal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("close");

const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

let maintenance = [];
let editId = null;

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

// Modal
openBtn.onclick = () => {
    modal.style.display = "flex";
    clearForm();
    editId = null;
};

closeBtn.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
};

// Save
document.getElementById("save").onclick = () => {

    const room = document.getElementById("room").value.trim();
    const issue = document.getElementById("issue").value.trim();
    const status = document.getElementById("status").value;

    if(!room || !issue){
        alert("Fill all fields");
        return;
    }

    if(editId){
        const m = maintenance.find(m => m.id === editId);
        m.room = room;
        m.issue = issue;
        m.status = status;
    } else {
        maintenance.push({
            id: Date.now(),
            room,
            issue,
            date: new Date().toLocaleDateString(),
            status
        });
    }

    modal.style.display = "none";
    render();
};

// Render
function render(data = maintenance){
    table.innerHTML = "";

    data.forEach(m => {
        table.innerHTML += `
        <tr>
            <td>${m.id}</td>
            <td>${m.room}</td>
            <td>${m.issue}</td>
            <td>${m.date}</td>
            <td><span class="status ${m.status.toLowerCase()}">${m.status}</span></td>
            <td>
                <button class="btn edit" onclick="editItem(${m.id})">Edit</button>
                <button class="btn delete" onclick="deleteItem(${m.id})">Delete</button>
            </td>
        </tr>`;
    });
}

// Edit
function editItem(id){
    const m = maintenance.find(m => m.id === id);

    document.getElementById("room").value = m.room;
    document.getElementById("issue").value = m.issue;
    document.getElementById("status").value = m.status;

    editId = id;
    modal.style.display = "flex";
}

// Delete
function deleteItem(id){
    maintenance = maintenance.filter(m => m.id !== id);
    render();
}

// Search
document.getElementById("search").oninput = function(){
    const val = this.value.toLowerCase();

    const filtered = maintenance.filter(m =>
        m.room.toLowerCase().includes(val) ||
        m.issue.toLowerCase().includes(val)
    );

    render(filtered);
};

// Clear
function clearForm(){
    document.getElementById("room").value = "";
    document.getElementById("issue").value = "";
}

render();