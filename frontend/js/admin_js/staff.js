const modal = document.getElementById("modal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("close");

const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

let staff = [];
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

// Open modal
openBtn.onclick = () => {
    modal.style.display = "flex";
    clearForm();
    editId = null;
};

// Close modal
closeBtn.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
};

// Save
document.getElementById("save").onclick = () => {

    const name = document.getElementById("name").value.trim();
    const role = document.getElementById("role").value.trim();
    const contact = document.getElementById("contact").value.trim();

    if(!name || !role || !contact){
        alert("Fill all fields");
        return;
    }

    if(editId){
        const s = staff.find(s => s.id === editId);
        s.name = name;
        s.role = role;
        s.contact = contact;
    } else {
        staff.push({
            id: Date.now(),
            name,
            role,
            contact
        });
    }

    modal.style.display = "none";
    render();
};

// Render
function render(data = staff){
    table.innerHTML = "";

    data.forEach(s => {
        table.innerHTML += `
        <tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.role}</td>
            <td>${s.contact}</td>
            <td>
                <button class="btn edit" onclick="editStaff(${s.id})">Edit</button>
                <button class="btn delete" onclick="deleteStaff(${s.id})">Delete</button>
            </td>
        </tr>`;
    });
}

// Edit
function editStaff(id){
    const s = staff.find(s => s.id === id);

    document.getElementById("name").value = s.name;
    document.getElementById("role").value = s.role;
    document.getElementById("contact").value = s.contact;

    editId = id;
    modal.style.display = "flex";
}

// Delete
function deleteStaff(id){
    staff = staff.filter(s => s.id !== id);
    render();
}

// Search
document.getElementById("search").oninput = function(){
    const val = this.value.toLowerCase();
    const filtered = staff.filter(s =>
        s.name.toLowerCase().includes(val) ||
        s.role.toLowerCase().includes(val)
    );
    render(filtered);
};

// Clear form
function clearForm(){
    document.getElementById("name").value = "";
    document.getElementById("role").value = "";
    document.getElementById("contact").value = "";
}

render();