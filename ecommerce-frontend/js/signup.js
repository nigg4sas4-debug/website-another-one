(function () {
    const signupForm = document.getElementById("customer-signup");
    const statusEl = document.getElementById("signup-status");

    const setStatus = (message, tone = "info") => {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.dataset.tone = tone;
        statusEl.hidden = !message;
    };

    const updateProfile = (name, email) => {
        localStorage.setItem(
            "profile",
            JSON.stringify({
                username: name?.split(" ").join("_") || email,
                fullname: name || email,
                email,
                phone: "",
                birthday: "",
                gender: "",
            })
        );
    };

    signupForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!window.DataStore) {
            alert("Signup is unavailable right now. Please try again later.");
            return;
        }

        const formData = new FormData(signupForm);
        const name = String(formData.get("name") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "").trim();
        const confirm = String(formData.get("confirm") || "").trim();
        const marketing = Boolean(formData.get("marketing"));
        const termsAccepted = Boolean(formData.get("terms"));

        if (!name || !email || !password || !confirm) {
            setStatus("Please fill in all fields.", "error");
            return;
        }

        if (!email.includes("@")) {
            setStatus("Enter a valid email address.", "error");
            return;
        }

        if (password.length < 6) {
            setStatus("Password must be at least 6 characters.", "error");
            return;
        }

        if (password !== confirm) {
            setStatus("Passwords do not match.", "error");
            return;
        }

        if (!termsAccepted) {
            setStatus("You must accept the terms to continue.", "error");
            return;
        }

        const users = DataStore.loadUsers();
        const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
            setStatus("An account with that email already exists. Try logging in.", "error");
            return;
        }

        users.push({
            name,
            email,
            marketingOptIn: marketing,
            passwordHash: btoa(password),
            createdAt: new Date().toISOString(),
        });

        DataStore.saveUsers(users);
        DataStore.setCurrentUser(email);
        updateProfile(name, email);

        setStatus("Account created! Taking you to the catalog...", "success");
        setTimeout(() => (window.location.href = "./product-catalog.html"), 700);
    });
})();
