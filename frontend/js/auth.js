document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) loginForm.addEventListener("submit", login);
  if (registerForm) registerForm.addEventListener("submit", register);
});

async function login(e) {
  e.preventDefault();
  const errorDiv = document.getElementById("error");
  errorDiv.innerText = "";
  
  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      errorDiv.innerText = "Please fill in all fields";
      return;
    }

    const res = await API.post("/auth/login", { email, password });
    saveToken(res.data.token);
    window.location = "notes.html";
  } catch (err) {
    const message = err.response?.data?.message || "Login failed. Please try again.";
    errorDiv.innerText = message;
  }
}

async function register(e) {
  e.preventDefault();
  const errorDiv = document.getElementById("error");
  errorDiv.innerText = "";
  
  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      errorDiv.innerText = "Please fill in all fields";
      return;
    }

    if (password.length < 8) {
      errorDiv.innerText = "Password must be at least 8 characters long";
      return;
    }

    await API.post("/auth/register", { email, password });
    document.getElementById("registerForm").reset();
    errorDiv.style.color = "green";
    errorDiv.innerText = "Account created! Redirecting to login...";
    setTimeout(() => {
      window.location = "index.html";
    }, 2000);
  } catch (err) {
    const message = err.response?.data?.message || "Registration failed. Please try again.";
    errorDiv.innerText = message;
  }
}
