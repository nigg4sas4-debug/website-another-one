(async function () {
    if (!window.apiClient) return;
    const productList = document.getElementById("product-list");
    const orderList = document.getElementById("order-list");
    const cancellationList = document.getElementById("cancellation-requests");

    async function loadProducts() {
        if (!productList) return;
        try {
            const products = await apiClient.getProducts();
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
        } catch (err) {
            productList.innerHTML = `<p class="muted">Unable to load products: ${err.message}</p>`;
        }
    }

    async function loadOrders() {
        if (!orderList && !cancellationList) return;
        try {
            const orders = await apiClient.listOrders();
            if (orderList) {
                orderList.innerHTML = orders
                    .map(
                        (order) => `
                    <article class="order-row" data-id="${order.id}">
                        <div>
                            <strong>Order ${order.id}</strong>
                            <p class="muted">${order.items
                                ?.map((item) => item.product?.name || `Product ${item.productId}`)
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
            }
            if (cancellationList) {
                const cancellations = orders.filter((order) => order.status === "CANCELLED");
                cancellationList.innerHTML = cancellations
                    .map(
                        (order) => `
                    <article class="order-row">
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
            const orderId = target.closest(".order-row")?.dataset.id;
            const status = target.value;
            try {
                await apiClient.updateOrderStatus(orderId, status);
            } catch (err) {
                alert(`Unable to update order: ${err.message}`);
            }
        }
    });

    await Promise.all([loadProducts(), loadOrders()]);
})();
