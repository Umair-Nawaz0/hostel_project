const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Demo login (replace with backend later)
    if (email === "admin@gmail.com" && password === "12345") {
        errorMsg.style.color = "lightgreen";
        errorMsg.textContent = "Login successful! Redirecting...";

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);
    } else {
        errorMsg.style.color = "#ff4d4d";
        errorMsg.textContent = "Invalid email or password";
    }
});