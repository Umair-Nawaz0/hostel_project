const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

hamburger.onclick = () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
};

overlay.onclick = () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
};

// DATA
let students = [];
let editId = null;

const table = document.getElementById("studentTable");

// RENDER
function render(data = students){
    table.innerHTML = "";

    data.forEach(s => {
        table.innerHTML += `
        <tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.room}</td>
            <td>${s.contact}</td>
            <td>
                <button class="action-btn edit" onclick="editStudent(${s.id})">Edit</button>
                <button class="action-btn delete" onclick="deleteStudent(${s.id})">Delete</button>
            </td>
        </tr>`;
    });
}

// MODAL
const modal = document.getElementById("modal");

document.getElementById("addBtn").onclick = () => {
    modal.style.display = "flex";
    editId = null;
};

document.getElementById("cancelBtn").onclick = () => {
    modal.style.display = "none";
};

// SAVE
document.getElementById("saveBtn").onclick = () => {

    const name = document.getElementById("name").value;
    const room = document.getElementById("room").value;
    const contact = document.getElementById("contact").value;

    if(!name || !room || !contact) return alert("Fill all fields");

    if(editId){
        let s = students.find(s => s.id === editId);
        s.name = name;
        s.room = room;
        s.contact = contact;
    } else {
        students.push({
            id: Date.now(),
            name,
            room,
            contact
        });
    }

    modal.style.display = "none";
    render();
};

// DELETE
function deleteStudent(id){
    students = students.filter(s => s.id !== id);
    render();
}

// EDIT
function editStudent(id){
    const s = students.find(s => s.id === id);

    document.getElementById("name").value = s.name;
    document.getElementById("room").value = s.room;
    document.getElementById("contact").value = s.contact;

    editId = id;
    modal.style.display = "flex";
}

// SEARCH
document.getElementById("search").oninput = function(){
    const val = this.value.toLowerCase();

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(val) ||
        s.room.toLowerCase().includes(val)
    );

    render(filtered);
};

// INIT
render();
