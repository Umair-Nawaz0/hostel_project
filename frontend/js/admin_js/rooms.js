const modal = document.getElementById("modal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");
const saveBtn = document.getElementById("saveBtn");

let rooms = [];
let editId = null;

const table = document.getElementById("roomTable");

// OPEN MODAL
openBtn.onclick = () => {
    modal.style.display = "flex";
    editId = null;
    clearForm();
};

// CLOSE MODAL
closeBtn.onclick = () => {
    modal.style.display = "none";
};

// SAVE ROOM
saveBtn.onclick = () => {

    const roomNo = document.getElementById("roomNo").value;
    const capacity = document.getElementById("capacity").value;
    const status = document.getElementById("status").value;

    if(!roomNo || !capacity){
        alert("Fill all fields");
        return;
    }

    if(editId){
        const r = rooms.find(r => r.id === editId);
        r.roomNo = roomNo;
        r.capacity = capacity;
        r.status = status;
    } else {
        rooms.push({
            id: Date.now(),
            roomNo,
            capacity,
            status
        });
    }

    modal.style.display = "none";
    render();
};

// RENDER TABLE
function render(){
    table.innerHTML = "";

    rooms.forEach(r => {
        table.innerHTML += `
        <tr>
            <td>${r.id}</td>
            <td>${r.roomNo}</td>
            <td>${r.capacity}</td>
            <td><span class="status ${r.status.toLowerCase()}">${r.status}</span></td>
            <td>
                <button class="action-btn edit" onclick="editRoom(${r.id})">Edit</button>
                <button class="action-btn delete" onclick="deleteRoom(${r.id})">Delete</button>
            </td>
        </tr>`;
    });
}

// EDIT
function editRoom(id){
    const r = rooms.find(r => r.id === id);

    document.getElementById("roomNo").value = r.roomNo;
    document.getElementById("capacity").value = r.capacity;
    document.getElementById("status").value = r.status;

    editId = id;
    modal.style.display = "flex";
}

// DELETE
function deleteRoom(id){
    rooms = rooms.filter(r => r.id !== id);
    render();
}

// CLEAR FORM
function clearForm(){
    document.getElementById("roomNo").value = "";
    document.getElementById("capacity").value = "";
}

// SEARCH
document.getElementById("search").oninput = function(){
    const val = this.value.toLowerCase();

    const filtered = rooms.filter(r =>
        r.roomNo.toLowerCase().includes(val)
    );

    table.innerHTML = "";
    filtered.forEach(r => {
        table.innerHTML += `
        <tr>
            <td>${r.id}</td>
            <td>${r.roomNo}</td>
            <td>${r.capacity}</td>
            <td><span class="status ${r.status.toLowerCase()}">${r.status}</span></td>
            <td>
                <button onclick="editRoom(${r.id})">Edit</button>
                <button onclick="deleteRoom(${r.id})">Delete</button>
            </td>
        </tr>`;
    });
};

render();