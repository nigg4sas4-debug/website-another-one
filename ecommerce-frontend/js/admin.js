(async function () {
    if (!window.apiClient) return;

    const productList = document.getElementById("product-list");
    const orderList = document.getElementById("admin-orders");
    const cancellationList = document.getElementById("cancellation-requests");
    const inventoryGrid = document.getElementById("inventory-grid");
    const categoryList = document.getElementById("category-list");
    const categoryForm = document.getElementById("category-form");
    const categorySelect = document.getElementById("product-category");
    const productForm = document.getElementById("product-form");
    const variationList = document.getElementById("variation-list");
    const addVariationBtn = document.getElementById("add-variation");
    const saleToggle = document.getElementById("product-sale");
    const discountWrapper = document.getElementById("discount-wrapper");
    const discountInput = document.getElementById("discount-pct");

    let cachedProducts = [];
    let cachedCategories = [];
    let cachedCancellations = [];

    function toggleDiscountVisibility() {
        if (!discountWrapper) return;
        discountWrapper.classList.toggle("hidden", !saleToggle?.checked);
        if (!saleToggle?.checked && discountInput) discountInput.value = "";
    }

    function createSizeRow({ label = "", stock = "", price = "" } = {}) {
        const row = document.createElement("div");
        row.className = "size-row";
        row.innerHTML = `
            <label>Size<input name="size-label" type="text" value="${label}" placeholder="S"></label>
            <label>Stock<input name="size-stock" type="number" min="0" value="${stock}" placeholder="0"></label>
            <label>Price<input name="size-price" type="number" min="0" step="0.01" value="${price}" placeholder="50"></label>
            <button type="button" class="link" data-remove-size>Remove</button>
        `;
        return row;
    }

    function createVariationBlock(name = "New Variation") {
        const block = document.createElement("div");
        block.className = "variation-block";
        const defaultSizes = ["XS", "S", "M", "L", "XL", "XXL"];
        block.innerHTML = `
            <div class="variation-head">
                <label>Variation<input name="variation-name" type="text" value="${name}"></label>
                <button type="button" class="link" data-remove-variation>Remove variation</button>
            </div>
            <div class="size-list"></div>
            <div class="variation-actions">
                <button type="button" class="btn ghost" data-add-size>Add size</button>
            </div>
        `;
        const sizeList = block.querySelector(".size-list");
        defaultSizes.forEach((label) => sizeList.appendChild(createSizeRow({ label })));
        return block;
    }

    function ensureInitialVariation() {
        if (!variationList) return;
        if (!variationList.children.length) {
            variationList.appendChild(createVariationBlock("Plain"));
        }
    }

    addVariationBtn?.addEventListener("click", () => {
        variationList?.appendChild(createVariationBlock("New Variation"));
    });

    variationList?.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.dataset.removeVariation) {
            const block = target.closest(".variation-block");
            block?.remove();
            ensureInitialVariation();
        }
        if (target.dataset.addSize) {
            const block = target.closest(".variation-block");
            block?.querySelector(".size-list")?.appendChild(createSizeRow());
        }
        if (target.dataset.removeSize) {
            const row = target.closest(".size-row");
            const block = target.closest(".variation-block");
            row?.remove();
            const sizeList = block?.querySelector(".size-list");
            if (sizeList && !sizeList.children.length) {
                sizeList.appendChild(createSizeRow());
            }
        }
    });

    function renderCategorySelect() {
        if (!categorySelect) return;
        const options = [`<option value="">Select a category</option>`]
            .concat(cachedCategories.map((cat) => `<option value="${cat.name}">${cat.name}</option>`))
            .join("");
        categorySelect.innerHTML = options;
    }

    function renderCategoryList() {
        if (!categoryList) return;
        if (!cachedCategories.length) {
            categoryList.innerHTML = `<p class="muted">No categories yet. Add one above.</p>`;
            return;
        }
        categoryList.innerHTML = cachedCategories
            .map(
                (cat) => `
                <article class="admin-card" data-category-id="${cat.id}">
                    <div class="stacked inline">
                        <label>Category<input name="category-name" type="text" value="${cat.name}"></label>
                        <div class="pill">${cat._count?.products ?? cat.products?.length ?? 0} products</div>
                    </div>
                    <div class="actions">
                        <button type="button" class="btn ghost" data-save-category>Save</button>
                        <button type="button" class="btn danger ghost" data-delete-category>Delete</button>
                    </div>
                </article>
            `
            )
            .join("");
    }

    async function loadCategories() {
        try {
            cachedCategories = await apiClient.listCategories();
            renderCategorySelect();
            renderCategoryList();
        } catch (err) {
            if (categoryList) categoryList.innerHTML = `<p class="muted">Unable to load categories: ${err.message}</p>`;
        }
    }

    categoryForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const name = String(fd.get("name") || "").trim();
        if (!name) return;
        try {
            await apiClient.createCategory(name);
            event.currentTarget.reset();
            await loadCategories();
        } catch (err) {
            alert(`Unable to create category: ${err.message}`);
        }
    });

    categoryList?.addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const card = target.closest("[data-category-id]");
        const id = card?.dataset.categoryId;
        if (!id) return;
        const input = card.querySelector("input[name='category-name']");
        if (target.dataset.saveCategory) {
            try {
                await apiClient.updateCategory(id, input.value);
                await loadCategories();
            } catch (err) {
                alert(`Unable to update category: ${err.message}`);
            }
        }
        if (target.dataset.deleteCategory) {
            if (!confirm("Delete this category? Products will become uncategorized.")) return;
            try {
                await apiClient.deleteCategory(id);
                await loadCategories();
            } catch (err) {
                alert(`Unable to delete category: ${err.message}`);
            }
        }
    });

    function renderProducts() {
        if (!productList) return;
        if (!cachedProducts.length) {
            productList.innerHTML = `<p class="muted">No products yet.</p>`;
            return;
        }
        productList.innerHTML = cachedProducts
            .map(
                (product) => `
                <article class="product-row">
                    <div>
                        <strong>${product.name}</strong>
                        <p class="muted">${product.category}</p>
                        ${product.onSale ? `<span class="pill pill-sale">Sale ${product.discountPct}%</span>` : ""}
                    </div>
                    <div class="pill">Stock: ${product.variations?.flatMap(v => v.sizes || []).reduce((s, sz) => s + (Number(sz.stock) || 0), 0)}</div>
                    <div class="price">${window.getPriceRange?.(product)}</div>
                </article>
            `
            )
            .join("");
    }

    function renderInventory() {
        if (!inventoryGrid) return;
        if (!cachedProducts.length) {
            inventoryGrid.innerHTML = `<p class="muted">No inventory to manage.</p>`;
            return;
        }
        const rows = [];
        cachedProducts.forEach((product) => {
            (product.variations || []).forEach((variation) => {
                (variation.sizes || []).forEach((size) => {
                    const displayPrice = size.originalPrice ?? size.price ?? 0;
                    rows.push(`
                        <article class="inventory-row" data-size-id="${size.id}">
                            <div>
                                <strong>${product.name}</strong>
                                <p class="muted">${variation.name} · ${size.label}</p>
                            </div>
                            <label>Stock<input type="number" min="0" value="${size.stock}" data-stock-input></label>
                            <label>Price<input type="number" min="0" step="0.01" value="${displayPrice}" data-price-input></label>
                            <button type="button" class="btn ghost" data-update-size>Update</button>
                        </article>
                    `);
                });
            });
        });
        inventoryGrid.innerHTML = rows.join("");
    }

    async function loadProducts() {
        try {
            cachedProducts = await apiClient.getProducts();
            renderProducts();
            renderInventory();
        } catch (err) {
            if (productList) productList.innerHTML = `<p class="muted">Unable to load products: ${err.message}</p>`;
        }
    }

    async function loadOrders() {
        if (!orderList) return;
        try {
            const orders = await apiClient.listOrders();
            const selectedTab = document.querySelector("[data-status-tab].active")?.dataset.statusTab?.toUpperCase();
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
        } catch (err) {
            orderList.innerHTML = `<p class="muted">Unable to load orders: ${err.message}</p>`;
        }
    }

    async function loadCancellations() {
        if (!cancellationList) return;
        try {
            cachedCancellations = await apiClient.listCancellations();
            const selectedTab = document.querySelector("[data-cancel-tab].active")?.dataset.cancelTab || "PENDING";
            const filtered = cachedCancellations.filter((req) => req.status === selectedTab);
            if (!filtered.length) {
                cancellationList.innerHTML = `<p class="muted">No ${selectedTab.toLowerCase()} requests.</p>`;
                return;
            }
            cancellationList.innerHTML = filtered
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
                .join("");
        } catch (err) {
            cancellationList.innerHTML = `<p class="muted">Unable to load cancellations: ${err.message}</p>`;
        }
    }

    orderList?.addEventListener("change", async (event) => {
        const target = event.target;
        if (target instanceof HTMLSelectElement && target.dataset.action === "status") {
            const orderId = target.closest(".order-card")?.dataset.id;
            const status = target.value;
            try {
                await apiClient.updateOrderStatus(orderId, status);
                await loadOrders();
            } catch (err) {
                alert(`Unable to update order: ${err.message}`);
            }
        }
    });

    cancellationList?.addEventListener("change", async (event) => {
        const target = event.target;
        if (target instanceof HTMLSelectElement && target.dataset.action === "cancel-status") {
            const cancelId = target.closest(".order-card")?.dataset.cancelId;
            const status = target.value;
            try {
                await apiClient.updateCancellation(cancelId, status);
                await loadCancellations();
            } catch (err) {
                alert(`Unable to update cancellation: ${err.message}`);
            }
        }
    });

    document.querySelectorAll("[data-status-tab]").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            document.querySelectorAll("[data-status-tab]").forEach((b) => b.classList.remove("active"));
            event.currentTarget.classList.add("active");
            loadOrders();
        });
    });

    document.querySelectorAll("[data-cancel-tab]").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            document.querySelectorAll("[data-cancel-tab]").forEach((b) => b.classList.remove("active"));
            event.currentTarget.classList.add("active");
            loadCancellations();
        });
    });

    inventoryGrid?.addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.dataset.updateSize) {
            const row = target.closest("[data-size-id]");
            const id = row?.dataset.sizeId;
            const stockInput = row?.querySelector("[data-stock-input]");
            const priceInput = row?.querySelector("[data-price-input]");
            try {
                await apiClient.updateSize(id, {
                    stock: Number(stockInput.value || 0),
                    price: Number(priceInput.value || 0),
                });
                await loadProducts();
            } catch (err) {
                alert(`Unable to update inventory: ${err.message}`);
            }
        }
    });

    productForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!window.apiClient) return alert("API unavailable");
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") || "").trim();
        const description = String(fd.get("description") || "").trim();
        const imageUrl = String(fd.get("imageUrl") || "").trim() || null;
        const category = String(fd.get("category") || "").trim();
        const featured = Boolean(fd.get("featured"));
        const onSale = Boolean(fd.get("sale"));
        const discountPct = onSale ? Number(fd.get("discountPct") || 0) : 0;

        const variations = Array.from(variationList?.querySelectorAll(".variation-block") || []).map((block) => {
            const variationName = block.querySelector("input[name='variation-name']")?.value || "Default";
            const sizes = Array.from(block.querySelectorAll(".size-row")).map((row) => {
                const label = row.querySelector("input[name='size-label']")?.value || "";
                const stock = Number(row.querySelector("input[name='size-stock']")?.value || 0);
                const price = Number(row.querySelector("input[name='size-price']")?.value || 0);
                return { label, stock, price };
            }).filter((s) => s.label);
            return { name: variationName, sizes };
        }).filter((v) => v.sizes.length);

        const totalStock = variations.flatMap((v) => v.sizes).reduce((sum, size) => sum + (Number(size.stock) || 0), 0);
        const basePrice = variations?.[0]?.sizes?.[0]?.price ?? 0;

        try {
            await apiClient.createProduct({
                name,
                description,
                imageUrl,
                category,
                featured,
                onSale,
                discountPct,
                stock: totalStock,
                price: basePrice,
                variations,
            });
            alert("Product created");
            await loadProducts();
            productForm.reset();
            variationList.innerHTML = "";
            ensureInitialVariation();
            toggleDiscountVisibility();
        } catch (err) {
            alert(`Unable to create product: ${err.message}`);
        }
    });

    toggleDiscountVisibility();
    ensureInitialVariation();
    await Promise.all([loadCategories(), loadProducts(), loadOrders(), loadCancellations()]);
})();
