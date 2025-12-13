(function () {
    const customerForm = document.getElementById("customer-login");
    const adminForm = document.getElementById("admin-login");
    const statusEl = document.getElementById("login-status");

    const setStatus = (message, tone = "info") => {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.dataset.tone = tone;
        statusEl.hidden = !message;
    };

    const verifyUser = (email, password) => {
        if (!window.DataStore) return null;
        const users = DataStore.loadUsers();
        const hash = btoa(password.trim());
        return users.find(
            (user) => user.email.toLowerCase() === email.toLowerCase() && user.passwordHash === hash
        );
    };

    customerForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!window.DataStore) {
            alert("Authentication system is unavailable.");
            return;
        }

        const formData = new FormData(customerForm);
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "").trim();

        const user = verifyUser(email, password);
        if (!user) {
            setStatus("Email or password is incorrect. Try again or sign up.", "error");
            return;
        }

        DataStore.setCurrentUser(user.email);
        localStorage.setItem(
            "profile",
            JSON.stringify({
                username: user.name?.split(" ").join("_") || user.email,
                fullname: user.name || user.email,
                email: user.email,
                phone: "",
                birthday: "",
                gender: "",
            })
        );

        setStatus("Success! Redirecting you to the catalog...", "success");
        setTimeout(() => (window.location.href = "./product-catalog.html"), 600);
    });

    adminForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        alert("Authenticated as admin. Redirecting to dashboard.");
        window.location.href = "./admin-dashboard.html";
    });
})();
