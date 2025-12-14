(async function () {
    if (!window.apiClient) return;
    const productList = document.getElementById("product-list");
    const orderList = document.getElementById("admin-orders");
    const cancellationList = document.getElementById("cancellation-requests");

    const inventoryGrid = document.getElementById("inventory-grid");

    async function loadProducts() {
        if (!productList && !inventoryGrid) return;
        let products = [];
        try {
            products = await apiClient.getProducts();
            if (productList) {
                productList.innerHTML = products
                .map(
                    (product) => `
                <article class="product-row">
                    <div>
                        <strong>${product.name}</strong>
                        <p class="muted">${product.description}</p>
                    </div>
                    <div class="pill">Stock: ${product.variations?.[0]?.sizes?.[0]?.stock ?? 0}</div>
                    <div class="price">$${product.variations?.[0]?.sizes?.[0]?.price.toFixed(2)}</div>
                </article>
            `
                )
                .join("");
            }
        } catch (err) {
            if (productList) {
                productList.innerHTML = `<p class="muted">Unable to load products: ${err.message}</p>`;
            } else {
                console.error('Unable to load products', err);
            }
        }
        // populate inventory grid if present
        if (inventoryGrid) {
            try {
                inventoryGrid.innerHTML = products
                    .map((product) => {
                        const totalStock = (product.variations || []).flatMap(v => v.sizes || []).reduce((s, sz) => s + (Number(sz.stock) || 0), 0);
                        return `
                            <article class="inventory-row">
                                <div>
                                    <strong>${product.name}</strong>
                                    <p class="muted">${product.variations?.[0]?.sizes?.[0]?.label || "Default"}</p>
                                </div>
                                <div class="pill">Stock: ${totalStock}</div>
                            </article>
                        `;
                    })
                    .join("");
            } catch (e) {
                inventoryGrid.innerHTML = `<p class="muted">Unable to load inventory: ${e.message}</p>`;
            }
        }
    }

    async function loadOrders() {
        if (!orderList && !cancellationList) return;
        try {
            const orders = await apiClient.listOrders();
            console.log("Orders from frontend:", JSON.stringify(orders, null, 2));
            if (orderList) {
                console.log("orderList before:", orderList.innerHTML);
                orderList.innerHTML = orders
                    .map(
                        (order) => `
                    <article class="order-card" data-id="${order.id}">
                        <div>
                            <strong>Order ${order.id}</strong>
                            <p class="muted">${order.items
                                ?.map((item) => `${item.quantity}x ${item.product?.name || `Product ${item.productId}`}`)
                                .join(", ")}</p>
                        </div>
                        <select data-action="status">
                            ${["PENDING", "PAID", "FULFILLED", "CANCELLED"].map(
                                (status) => `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
                            ).join("")}
                        </select>
                        <span class="pill">$${Number(order.total).toFixed(2)}</span>
                    </article>
                `
                    )
                    .join("");
                console.log("orderList after:", orderList.innerHTML);
            }
            if (cancellationList) {
                const cancellations = orders.filter((order) => order.status === "CANCELLED");
                cancellationList.innerHTML = cancellations
                    .map(
                        (order) => `
                    <article class="order-card">
                        <div>
                            <strong>${order.id}</strong>
                            <p class="muted">Cancelled</p>
                        </div>
                        <span class="pill pill-accent">CANCELLED</span>
                    </article>
                `
                    )
                    .join("");
            }
        } catch (err) {
            if (orderList) orderList.innerHTML = `<p class="muted">Unable to load orders: ${err.message}</p>`;
        }
    }

    orderList?.addEventListener("change", async (event) => {
        const target = event.target;
        if (target instanceof HTMLSelectElement && target.dataset.action === "status") {
            const orderId = target.closest(".order-card")?.dataset.id;
            const status = target.value;
            try {
                await apiClient.updateOrderStatus(orderId, status);
            } catch (err) {
                alert(`Unable to update order: ${err.message}`);
            }
        }
    });

    await Promise.all([loadProducts(), loadOrders()]);

    // Handle product creation form
    const productForm = document.getElementById("product-form");
    productForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!window.apiClient) return alert("API unavailable");
        const form = e.currentTarget;
        const fd = new FormData(form);
        const name = String(fd.get("name") || "").trim();
        const description = String(fd.get("description") || "").trim();
        const price = Number(fd.get("price") || 0);

        // Compute stock from sizes inputs if present
        let stock = 0;
        document.querySelectorAll('#variation-list input[name="sizes"]').forEach((el) => {
            const v = el.value || ""; // format: S:10:50,M:6:52
                v.split(",").forEach((part) => {
                    const parts = part.split(":"); // Fixed the syntax error here
                if (parts.length >= 2) {
                    const qty = Number(parts[1]) || 0;
                    stock += qty;
                }
            });
        });

        try {
            await apiClient.createProduct({ name, description, price, stock });
            alert('Product created');
            loadProducts();
            form.reset();
        } catch (err) {
            alert(`Unable to create product: ${err.message}`);
        }
    });
})();
