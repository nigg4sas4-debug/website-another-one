(function () {
    const customerForm = document.getElementById("customer-login");
    const adminForm = document.getElementById("admin-login");

    customerForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        alert("Welcome back! Explore new arrivals in the catalog.");
        window.location.href = "./product-catalog.html";
    });

    adminForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        alert("Authenticated as admin. Redirecting to dashboard.");
        window.location.href = "./admin-dashboard.html";
    });
})();
