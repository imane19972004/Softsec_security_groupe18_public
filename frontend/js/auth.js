/**
 * Authentication
 */

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) loginForm.addEventListener("submit", login);
  if (registerForm) registerForm.addEventListener("submit", register);

  const passwordInput = document.getElementById("password");
  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      validatePasswordFrontend(passwordInput.value);
    });
  }
});

async function login(e) {
  e.preventDefault();

  const errorDiv = document.getElementById("error");
  if (errorDiv) {
    errorDiv.style.color = "var(--danger)";
    errorDiv.innerText = "";
  }

  try {
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
      throw new Error("Please fill in all fields");
    }

    const res = await API.post("/auth/login", { email, password });

    saveToken(res.data.token);

    window.location.href = "notes.html";
  } catch (err) {
    if (errorDiv) {
      errorDiv.innerText =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again.";
    }
  }
}

function validatePasswordFrontend(password) {
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password)
  };

  Object.entries(rules).forEach(([rule, valid]) => {
    const li = document.querySelector(
      `#passwordRules li[data-rule="${rule}"]`
    );
    if (li) li.classList.toggle("valid", valid);
  });

  return Object.values(rules).every(Boolean);
}

async function register(e) {
  e.preventDefault();

  const errorDiv = document.getElementById("error");
  errorDiv.style.color = "var(--danger)";
  errorDiv.innerText = "";

  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      throw new Error("Please fill in all fields");
    }

    if (!validatePasswordFrontend(password)) {
      throw new Error(
        "Password must contain at least 8 characters, one uppercase letter, and one number"
      );
    }

    await API.post("/auth/register", { email, password });

    errorDiv.style.color = "var(--success)";
    errorDiv.innerText = "Account created! Redirecting to login...";

    document.getElementById("registerForm").reset();

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  } catch (err) {
    errorDiv.innerText =
      err.response?.data?.message ||
      err.message ||
      "Registration failed. Please try again.";
  }
}

class Auth {
  init() {
    this.setupPasswordToggle();
    this.setupLoadingStates();
    this.setupServerStatus();
    this.setupPasswordStrength();
    this.focusEmailOnLoad();
  }

  /* Password visibility */
  setupPasswordToggle() {
    const toggleBtn = document.querySelector(".password-toggle");
    const passwordInput = document.getElementById("password");

    if (!toggleBtn || !passwordInput) return;

    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      toggleBtn.textContent = isHidden ? "🙈" : "👁️";
    });
  }

  /* Button loading states */
  setupLoadingStates() {
    const originalLogin = window.login;
    const originalRegister = window.register;

    if (typeof originalLogin === "function") {
      window.login = async (e) => {
        const btn = document.getElementById("loginBtn");
        if (!btn) return originalLogin(e);

        const text = btn.textContent;
        btn.disabled = true;
        btn.classList.add("btn-loading");
        btn.textContent = "Signing in...";

        try {
          await originalLogin(e);
        } finally {
          btn.disabled = false;
          btn.classList.remove("btn-loading");
          btn.textContent = text;
        }
      };
    }

    if (typeof originalRegister === "function") {
      window.register = async (e) => {
        const btn = document.getElementById("registerBtn");
        if (!btn) return originalRegister(e);

        const text = btn.textContent;
        btn.disabled = true;
        btn.classList.add("btn-loading");
        btn.textContent = "Creating account...";

        try {
          await originalRegister(e);
        } finally {
          btn.disabled = false;
          btn.classList.remove("btn-loading");
          btn.textContent = text;
        }
      };
    }
  }

  /* Failover / server status */
  setupServerStatus() {
    if (!window.failoverService) return;

    const update = (connected, name) =>
      this.updateServerStatus({ connected, serverName: name });

    window.failoverService.setOnServerChange((e) => {
      if (e?.to?.name) update(true, e.to.name);
    });

    window.failoverService.setOnHealthStatusChange((status) => {
      if (!status?.healthy) {
        update(false, "All servers offline");
      } else if (status.server?.name) {
        update(true, status.server.name);
      }
    });

    const current = window.failoverService.getCurrentServer?.();
    if (current?.name) update(true, current.name);
  }

  updateServerStatus({ connected, serverName }) {
    const text = document.getElementById("statusText");
    const dot = document.getElementById("statusDot");

    if (text) {
      text.textContent = connected
        ? `Connected to ${serverName}`
        : serverName;
    }

    if (dot) {
      dot.classList.toggle("disconnected", !connected);
    }
  }

  /* Password strength (register only) */
  setupPasswordStrength() {
    if (!location.pathname.includes("register")) return;

    const input = document.getElementById("password");
    if (!input) return;

    let container = document.getElementById("passwordStrength");
    let text = document.getElementById("passwordStrengthText");

    if (!container) {
      container = document.createElement("div");
      container.id = "passwordStrength";
      container.className = "password-strength";
      container.innerHTML = `<div class="password-strength-bar"></div>`;

      text = document.createElement("div");
      text.id = "passwordStrengthText";
      text.className = "password-strength-text";

      input.parentElement.append(container, text);
    }

    input.addEventListener("input", () => {
      if (!input.value) {
        container.classList.remove("show");
        text.textContent = "";
        return;
      }

      const { level, message, color } =
        this.calculatePasswordStrength(input.value);

      container.classList.add("show");
      container.firstElementChild.className =
        `password-strength-bar ${level}`;
      text.textContent = message;
      text.style.color = color;
    });
  }

  calculatePasswordStrength(pwd) {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 2)
      return { level: "weak", message: "Weak password", color: "var(--danger)" };
    if (score <= 4)
      return {
        level: "medium",
        message: "Medium strength",
        color: "var(--warning)"
      };

    return {
      level: "strong",
      message: "Strong password",
      color: "var(--success)"
    };
  }

  focusEmailOnLoad() {
    window.addEventListener("load", () => {
      document.getElementById("email")?.focus();
    });
  }
}

if (typeof window !== "undefined") {
  const auth = new Auth();
  auth.init();

  window.Auth = Auth;
  window.auth = auth;
}
