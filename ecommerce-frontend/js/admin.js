(function () {
    if (!window.DataStore) return;
    const form = document.getElementById("product-form");
    const inventoryGrid = document.getElementById("inventory-grid");
    const adminOrders = document.getElementById("admin-orders");
    const variationList = document.getElementById("variation-list");
    const addVariationBtn = document.getElementById("add-variation");
    const cancellationGrid = document.getElementById("cancellation-requests");
    const orderTabs = document.getElementById("order-tabs");
    let activeOrderTab = "Processing";

    function readFilesAsDataUrls(fileList) {
        const files = Array.from(fileList || []);
        return Promise.all(
            files.map(
                (file) =>
                    new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    })
            )
        );
    }

    function createVariationRow(name = "", sizes = "") {
        const row = document.createElement("div");
        row.className = "variation-row";
        row.innerHTML = `
            <div class="grid-2">
                <label>Variation Name<input name="variation" type="text" placeholder="Plain"></label>
                <label>Sizes, Stock & Prices<input name="sizes" type="text" placeholder="S:10:50,M:6:52,L:2:54"></label>
            </div>
            <div class="variation-actions">
                <button type="button" class="link remove-variation" aria-label="Remove variation">Remove</button>
            </div>
        `;
        row.querySelector('input[name="variation"]').value = name;
        row.querySelector('input[name="sizes"]').value = sizes;
        return row;
    }

    function updateRemoveButtons() {
        if (!variationList) return;
        const buttons = variationList.querySelectorAll(".remove-variation");
        const disable = buttons.length === 1;
        buttons.forEach((btn) => (btn.disabled = disable));
    }

    function resetVariations() {
        if (!variationList) return;
        variationList.innerHTML = "";
        variationList.appendChild(createVariationRow("Standard", "M:5:50,L:5:50"));
        updateRemoveButtons();
    }

    function renderInventory() {
        const products = DataStore.loadProducts();
        inventoryGrid.innerHTML = products
            .map(
                (product, index) => `
            <article class="order-card">
                <header>
                    <strong>${product.name}</strong>
                    <span class="pill">${product.category}</span>
                </header>
                ${product.variations
                    .map(
                        (variation, vIndex) => `
                        <div class="admin-card">
                            <div class="row"><span>${variation.name}</span><small class="muted">Adjust stock</small></div>
                            ${variation.sizes
                                .map(
                                    (size, sIndex) => `
                                    <div class="variation-grid">
                                        <label class="row">Size ${size.label}
                                            <input type="number" data-field="stock" data-product="${index}" data-var="${vIndex}" data-size="${sIndex}" value="${size.stock}" min="0">
                                        </label>
                                        <label class="row">Price
                                            <input type="number" step="0.01" data-field="price" data-product="${index}" data-var="${vIndex}" data-size="${sIndex}" value="${size.price}" min="0">
                                        </label>
                                    </div>
                                `
                                )
                                .join("")}
                        </div>
                    `
                    )
                    .join("")}
            </article>
        `
            )
            .join("");
    }

    function renderOrders(statusFilter = activeOrderTab) {
        const orders = DataStore.loadOrders();
        const filtered = orders.filter((order) =>
            statusFilter === "Processing" ? ["Processing", "Pending"].includes(order.status) : order.status === statusFilter
        );
        adminOrders.innerHTML = filtered
            .map(
                (order, index) => `
            <article class="order-card">
                <header>
                    <strong>${order.id}</strong>
                </header>
                ${order.cancellationRequest ? `<div class="alert">Cancellation ${order.cancellationRequest.status?.toLowerCase() || "requested"}</div>` : ""}
                <div class="order-items">${order.items
                    .map((item) => `${item.name} (${item.variation} • ${item.size}) x${item.qty}`)
                    .join("<br>")}</div>
                <div class="order-details">
                    <span><strong>${order.customer || "Guest"}</strong>${order.email ? ` • ${order.email}` : ""}</span>
                    ${order.phone ? `<span>Phone: ${order.phone}</span>` : ""}
                    ${order.address ? `<span>${order.address}${order.city ? `, ${order.city}` : ""}${order.zip ? ` ${order.zip}` : ""}</span>` : "<span>No address provided</span>"}
                </div>
                <div class="row"><span>Total</span><strong>$${order.total.toFixed(2)}</strong></div>
                <label class="row">Status
                    <select data-id="${order.id}">
                        ${["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
                            .map((status) => `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`)
                            .join("")}
                    </select>
                </label>
            </article>
        `
            )
            .join("") || `<p class="muted">No ${statusFilter.toLowerCase()} orders right now.</p>`;
    }

    function renderCancellations() {
        const orders = DataStore.loadOrders();
        const pending = orders.filter((order) => order.cancellationRequest?.status === "Requested");
        cancellationGrid.innerHTML = pending
            .map(
                (order) => `
            <article class="order-card">
                <header>
                    <strong>${order.id}</strong>
                    <span class="pill">${order.status}</span>
                </header>
                <p class="muted">${order.cancellationRequest?.reason || "No reason provided."}</p>
                <div class="row" data-cancel="${order.id}">
                    <button class="btn ghost" data-action="reject">Reject</button>
                    <button class="btn" data-action="accept">Accept</button>
                </div>
            </article>
        `
            )
            .join("") || `<p class="muted">No pending cancellation requests.</p>`;
    }

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const name = data.get("name");
        const category = data.get("category");
        const price = Number(data.get("price"));
        const featured = data.get("featured") === "on";
        const description = data.get("description") || "Fresh release from the studio.";
        const imageFiles = form.querySelector('input[name="images"]')?.files || [];
        const uploadedImages = imageFiles.length ? await readFilesAsDataUrls(imageFiles) : [];
        const variationRows = variationList ? Array.from(variationList.querySelectorAll(".variation-row")) : [];
        const variations = (variationRows.length ? variationRows : [createVariationRow("Standard", "M:5:50,L:5:50")]).map((row, index) => {
            const variationName = row.querySelector('input[name="variation"]')?.value || "Standard";
            const sizesRaw = String(row.querySelector('input[name="sizes"]')?.value || "M:5:50,L:5:50");
            const sizes = sizesRaw.split(",").map((pair) => {
                const [label, stock, priceOverride] = pair.split(":");
                return { label: label?.trim() || "M", stock: Number(stock) || 0, price: Number(priceOverride || price) || price };
            });
            const fallbackImage = uploadedImages[index] || uploadedImages[0] || ImageFactory.createPlaceholder(`${name || "New"} ${variationName}`);
            return {
                name: variationName,
                image: fallbackImage,
                gallery: uploadedImages.length ? uploadedImages : ["#7c3aed", "#22c55e"],
                sizes,
            };
        });
        const product = {
            id: `${name}-${Date.now()}`.toLowerCase().replace(/\s+/g, "-"),
            name,
            category,
            price,
            description,
            featured,
            available: true,
            badges: ["New"],
            rating: 4.4,
            variations,
        };
        const products = DataStore.loadProducts();
        products.unshift(product);
        DataStore.saveProducts(products);
        form.reset();
        resetVariations();
        renderInventory();
    });

    addVariationBtn?.addEventListener("click", () => {
        if (!variationList) return;
        variationList.appendChild(createVariationRow());
        updateRemoveButtons();
    });

    variationList?.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLButtonElement && target.classList.contains("remove-variation")) {
            target.closest(".variation-row")?.remove();
            updateRemoveButtons();
        }
    });

    inventoryGrid?.addEventListener("change", (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement) {
            const products = DataStore.loadProducts();
            const pIndex = Number(target.dataset.product);
            const vIndex = Number(target.dataset.var);
            const sIndex = Number(target.dataset.size);
            const product = products[pIndex];
            if (product?.variations?.[vIndex]?.sizes?.[sIndex]) {
                const field = target.dataset.field || "stock";
                const value = Math.max(0, Number(target.value));
                if (field === "price") {
                    product.variations[vIndex].sizes[sIndex].price = value;
                } else {
                    product.variations[vIndex].sizes[sIndex].stock = value;
                }
                DataStore.saveProducts(products);
            }
        }
    });

    adminOrders?.addEventListener("change", (event) => {
        const target = event.target;
        if (target instanceof HTMLSelectElement) {
            const orders = DataStore.loadOrders();
            const orderId = target.dataset.id;
            const order = orders.find((o) => o.id === orderId);
            if (order) {
                order.status = target.value;
                DataStore.saveOrders(orders);
                renderOrders(activeOrderTab);
                renderCancellations();
            }
        }
    });

    orderTabs?.addEventListener("click", (event) => {
        const button = event.target;
        if (button instanceof HTMLButtonElement && button.dataset.statusTab) {
            activeOrderTab = button.dataset.statusTab;
            orderTabs.querySelectorAll("button").forEach((btn) => btn.classList.toggle("active", btn === button));
            renderOrders(activeOrderTab);
        }
    });

    cancellationGrid?.addEventListener("click", (event) => {
        const button = event.target;
        if (button instanceof HTMLButtonElement && button.dataset.action) {
            const orderId = button.closest("[data-cancel]")?.dataset.cancel;
            const orders = DataStore.loadOrders();
            const order = orders.find((o) => o.id === orderId);
            if (order?.cancellationRequest) {
                order.cancellationRequest.status = button.dataset.action === "accept" ? "Accepted" : "Rejected";
                if (button.dataset.action === "accept") {
                    order.status = "Cancelled";
                }
                DataStore.saveOrders(orders);
                renderOrders(activeOrderTab);
                renderCancellations();
            }
        }
    });

    renderInventory();
    renderOrders();
    renderCancellations();
    resetVariations();
})();
