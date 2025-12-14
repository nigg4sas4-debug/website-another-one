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
            const [orders, cancellations] = await Promise.all([
                apiClient.listOrders(),
                apiClient.listCancellations(),
            ]);

            if (orderList) {
                const selectedTab = document.querySelector('[data-status-tab].active')?.dataset.statusTab?.toUpperCase();
                const filtered = selectedTab ? orders.filter((o) => o.status === selectedTab) : orders;
                orderList.innerHTML = filtered
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
                            ${["PROCESSING", "SHIPPED", "DELIVERED"].map(
                                (status) => `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
                            ).join("")}
                        </select>
                        <span class="pill">$${Number(order.total).toFixed(2)}</span>
                    </article>
                `
                    )
                    .join("");
            }
            if (cancellationList) {
                const grouped = { PENDING: [], REJECTED: [], SUCCESS: [] };
                (cancellations || []).forEach((req) => {
                    grouped[req.status]?.push(req);
                });
                cancellationList.innerHTML = Object.entries(grouped)
                    .map(([status, list]) => `
                        <div class="stacked">
                            <h4>${status}</h4>
                            ${list
                                .map(
                                    (req) => `
                                        <article class="order-card" data-cancel-id="${req.id}">
                                            <div>
                                                <strong>Order ${req.orderId}</strong>
                                                <p class="muted">${req.reason || "Customer request"}</p>
                                            </div>
                                            <select data-action="cancel-status">
                                                ${["PENDING", "REJECTED", "SUCCESS"].map(
                                                    (opt) => `<option value="${opt}" ${req.status === opt ? "selected" : ""}>${opt}</option>`
                                                ).join("")}
                                            </select>
                                        </article>
                                    `
                                )
                                .join("") || `<p class="muted">No ${status.toLowerCase()} requests</p>`}
                        </div>
                    `)
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
        if (target instanceof HTMLSelectElement && target.dataset.action === "cancel-status") {
            const cancelId = target.closest(".order-card")?.dataset.cancelId;
            const status = target.value;
            try {
                await apiClient.updateCancellation(cancelId, status);
            } catch (err) {
                alert(`Unable to update cancellation: ${err.message}`);
            }
        }
    });

    document.querySelectorAll('[data-status-tab]').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            document.querySelectorAll('[data-status-tab]').forEach((b) => b.classList.remove('active'));
            event.currentTarget.classList.add('active');
            loadOrders();
        });
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
