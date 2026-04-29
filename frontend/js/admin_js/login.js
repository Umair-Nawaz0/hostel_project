const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("errorMsg");
const togglePassword = document.getElementById("togglePassword");
const eyeOpen = document.getElementById("eyeOpen");
const eyeClosed = document.getElementById("eyeClosed");
const loginButton = document.getElementById("loginButton");
const buttonText = document.getElementById("buttonText");
const buttonSpinner = document.getElementById("buttonSpinner");
const loginCard = document.getElementById("loginCard");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validEmail = "admin@gmail.com";
const validPassword = "12345";

function shakeCard() {
    loginCard.classList.remove("shake-card");
    void loginCard.offsetWidth;
    loginCard.classList.add("shake-card");
}

function setMessage(message, type = "error") {
    errorMsg.textContent = message;
    errorMsg.classList.remove("text-rose-300", "text-emerald-300");
    errorMsg.classList.add(type === "success" ? "text-emerald-300" : "text-rose-300");
}

function clearMessage() {
    errorMsg.textContent = "";
    errorMsg.classList.remove("text-rose-300", "text-emerald-300");
}

function setLoading(isLoading) {
    loginButton.disabled = isLoading;
    emailInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    togglePassword.disabled = isLoading;

    buttonText.textContent = isLoading ? "Signing In..." : "Login";
    buttonSpinner.classList.toggle("hidden", !isLoading);
}

togglePassword.addEventListener("click", () => {
    const showPassword = passwordInput.type === "password";
    passwordInput.type = showPassword ? "text" : "password";
    togglePassword.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
    togglePassword.setAttribute("aria-pressed", String(showPassword));
    eyeOpen.classList.toggle("hidden", showPassword);
    eyeClosed.classList.toggle("hidden", !showPassword);
});

[emailInput, passwordInput].forEach((input) => {
    input.addEventListener("input", () => {
        clearMessage();
        loginCard.classList.remove("shake-card");
    });
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    clearMessage();

    if (!email || !password) {
        setMessage("Email and password are required.");
        shakeCard();
        return;
    }

    if (!emailPattern.test(email)) {
        setMessage("Enter a valid email address.");
        shakeCard();
        return;
    }

    setLoading(true);

    await new Promise((resolve) => {
        setTimeout(resolve, 1500);
    });

    if (email === validEmail && password === validPassword) {
        setMessage("Login successful.", "success");

        setTimeout(() => {
            console.log("Redirecting to dashboard.html");
            window.location.href = "dashboard.html";
        }, 700);
        return;
    }

    setLoading(false);
    setMessage("Invalid email or password.");
    shakeCard();
});
