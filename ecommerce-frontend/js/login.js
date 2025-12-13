(async function () {
    const customerForm = document.getElementById("customer-login");
    const adminForm = document.getElementById("admin-login");
    const statusEl = document.getElementById("login-status");

    const setStatus = (message, tone = "info") => {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.dataset.tone = tone;
        statusEl.hidden = !message;
    };

    async function authenticate(email, password) {
        if (!window.apiClient) throw new Error("API client unavailable");
        const user = await apiClient.login(email, password);
        localStorage.setItem("profile", JSON.stringify({ email: user.email, role: user.role }));
        return user;
    }

    customerForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(customerForm);
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "").trim();

        try {
            await authenticate(email, password);
            setStatus("Success! Redirecting you to the catalog...", "success");
            setTimeout(() => (window.location.href = "./product-catalog.html"), 600);
        } catch (err) {
            setStatus(err.message || "Email or password is incorrect. Try again or sign up.", "error");
        }
    });

    adminForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(adminForm);
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "").trim();
        try {
            const user = await authenticate(email, password);
            if (user.role !== "ADMIN") {
                setStatus("Admin access denied for this account.", "error");
                return;
            }
            alert("Authenticated as admin. Redirecting to dashboard.");
            window.location.href = "./admin-dashboard.html";
        } catch (err) {
            setStatus(err.message || "Unable to authenticate admin.", "error");
        }
    });
})();
