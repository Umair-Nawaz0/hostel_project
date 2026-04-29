const modal = document.getElementById("modal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("close");

const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

let payments = [];
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
};

closeBtn.onclick = () => modal.style.display = "none";

// Close modal outside click
window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
};

// Save
document.getElementById("save").onclick = () => {
    const student = document.getElementById("student").value.trim();
    const amount = document.getElementById("amount").value;
    const status = document.getElementById("status").value;

    if(!student || !amount){
        alert("Please fill all fields");
        return;
    }

    payments.push({
        id: Date.now(),
        student,
        amount,
        date: new Date().toLocaleDateString(),
        status
    });

    modal.style.display = "none";
    render();
};

// Render
function render(data = payments){
    table.innerHTML = "";

    data.forEach(p => {
        table.innerHTML += `
        <tr>
            <td>${p.id}</td>
            <td>${p.student}</td>
            <td>Rs ${p.amount}</td>
            <td>${p.date}</td>
            <td><span class="status ${p.status.toLowerCase()}">${p.status}</span></td>
            <td>
                <button class="delete" onclick="deletePayment(${p.id})">Delete</button>
            </td>
        </tr>`;
    });
}

// Delete
function deletePayment(id){
    payments = payments.filter(p => p.id !== id);
    render();
}

// Search
document.getElementById("search").oninput = function(){
    const val = this.value.toLowerCase();

    const filtered = payments.filter(p =>
        p.student.toLowerCase().includes(val)
    );

    render(filtered);
};

// Clear form
function clearForm(){
    document.getElementById("student").value = "";
    document.getElementById("amount").value = "";
}

render();