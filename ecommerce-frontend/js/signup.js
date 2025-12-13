(async function () {
    const form = document.getElementById("signup-form");
    const statusEl = document.getElementById("signup-status");

    const setStatus = (message, tone = "info") => {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.dataset.tone = tone;
        statusEl.hidden = !message;
    };

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!window.apiClient) {
            alert("Sign up is unavailable without the API.");
            return;
        }
        const data = new FormData(form);
        const email = String(data.get("email") || "").trim();
        const password = String(data.get("password") || "").trim();
        const confirm = String(data.get("confirm-password") || "").trim();

        if (!email || !password) {
            setStatus("Email and password are required.", "error");
            return;
        }
        if (password !== confirm) {
            setStatus("Passwords do not match.", "error");
            return;
        }

        try {
            await apiClient.register(email, password);
            setStatus("Account created! Redirecting...", "success");
            setTimeout(() => (window.location.href = "./product-catalog.html"), 800);
        } catch (err) {
            setStatus(err.message || "Unable to sign up.", "error");
        }
    });
})();
