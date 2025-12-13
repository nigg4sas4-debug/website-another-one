(function () {
    if (!window.DataStore) return;
    const form = document.getElementById("product-form");
    const inventoryGrid = document.getElementById("inventory-grid");
    const adminOrders = document.getElementById("admin-orders");
    const variationList = document.getElementById("variation-list");
    const addVariationBtn = document.getElementById("add-variation");

    function createVariationRow(name = "", sizes = "") {
        const row = document.createElement("div");
        row.className = "variation-row";
        row.innerHTML = `
            <div class="grid-2">
                <label>Variation Name<input name="variation" type="text" placeholder="Plain"></label>
                <label>Sizes & Stock<input name="sizes" type="text" placeholder="S:10,M:6,L:2"></label>
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
        variationList.appendChild(createVariationRow("Standard", "M:5,L:5"));
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
                                    <label class="row">${size.label}
                                        <input type="number" data-product="${index}" data-var="${vIndex}" data-size="${sIndex}" value="${size.stock}" min="0">
                                    </label>
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

    function renderOrders() {
        const orders = DataStore.loadOrders();
        adminOrders.innerHTML = orders
            .map(
                (order, index) => `
            <article class="order-card">
                <header>
                    <strong>${order.id}</strong>
                    <select data-index="${index}">
                        ${["Pending", "Processing", "Shipped", "Cancelled"]
                            .map((status) => `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`)
                            .join("")}
                    </select>
                </header>
                <div class="order-items">${order.items
                    .map((item) => `${item.name} (${item.variation} • ${item.size}) x${item.qty}`)
                    .join("<br>")}</div>
                <div class="order-details">
                    <span><strong>${order.customer || "Guest"}</strong>${order.email ? ` • ${order.email}` : ""}</span>
                    ${order.phone ? `<span>Phone: ${order.phone}</span>` : ""}
                    ${order.address ? `<span>${order.address}${order.city ? `, ${order.city}` : ""}${order.zip ? ` ${order.zip}` : ""}</span>` : "<span>No address provided</span>"}
                </div>
                <div class="row"><span>Total</span><strong>$${order.total.toFixed(2)}</strong></div>
            </article>
        `
            )
            .join("");
    }

    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const name = data.get("name");
        const category = data.get("category");
        const price = Number(data.get("price"));
        const featured = data.get("featured") === "on";
        const description = data.get("description") || "Fresh release from the studio.";
        const variationRows = variationList ? Array.from(variationList.querySelectorAll(".variation-row")) : [];
        const variations = (variationRows.length ? variationRows : [createVariationRow("Standard", "M:5,L:5")]).map((row) => {
            const variationName = row.querySelector('input[name="variation"]')?.value || "Standard";
            const sizesRaw = String(row.querySelector('input[name="sizes"]')?.value || "M:5,L:5");
            const sizes = sizesRaw.split(",").map((pair) => {
                const [label, stock] = pair.split(":");
                return { label: label?.trim() || "M", stock: Number(stock) || 0, price };
            });
            return {
                name: variationName,
                image: ImageFactory.createPlaceholder(`${name || "New"} ${variationName}`),
                gallery: ["#7c3aed", "#22c55e"],
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
                product.variations[vIndex].sizes[sIndex].stock = Math.max(0, Number(target.value));
                DataStore.saveProducts(products);
            }
        }
    });

    adminOrders?.addEventListener("change", (event) => {
        const target = event.target;
        if (target instanceof HTMLSelectElement) {
            const orders = DataStore.loadOrders();
            const index = Number(target.dataset.index);
            if (orders[index]) {
                orders[index].status = target.value;
                DataStore.saveOrders(orders);
            }
        }
    });

    renderInventory();
    renderOrders();
    resetVariations();
})();
