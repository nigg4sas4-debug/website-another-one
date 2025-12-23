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
    const productImageUpload = document.getElementById("product-image-upload");
    const productImagePreview = document.getElementById("product-image-preview");
    const base64ImageHidden = document.getElementById("base64-image-hidden");
    const variationList = document.getElementById("variation-list");
    const addVariationBtn = document.getElementById("add-variation");
    const trashList = document.getElementById("trash-list");

    let cachedProducts = [];
    let cachedCategories = [];
    let cachedCancellations = [];
    let cachedTrashed = [];

    window.closeEditModal = () => {
        document.getElementById('edit-product-modal')?.remove();
    }

    // Image upload and preview
    productImageUpload?.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                productImagePreview.src = e.target.result;
                productImagePreview.classList.remove("hidden");
                base64ImageHidden.value = e.target.result; // Store Base64 string in hidden input
            };
            reader.readAsDataURL(file);
        } else {
            productImagePreview.src = "";
            productImagePreview.classList.add("hidden");
            base64ImageHidden.value = "";
        }
    });

    

    function createSizeRow({ label = "", price = "" } = {}) {
        const row = document.createElement("div");
        row.className = "size-row";
        row.innerHTML = `
            <label>Size<input name="size-label" type="text" value="${label}" placeholder="S"></label>
            <label>Price<input name="size-price" type="number" min="0" step="0.01" value="${price}" placeholder="0.00"></label>
            <button type="button" class="btn sm ghost danger" data-remove-size>Remove</button>
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
            event.target.reset();
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
                        <p class="muted">${product.category?.name || 'Uncategorized'}</p>
                        ${product.onSale ? `<span class="pill pill-sale">Sale ${product.discountPct}%</span>` : ""}
                    </div>
                    <div class="pill">Stock: ${product.variations?.flatMap(v => v.sizes || []).reduce((s, sz) => s + (Number(sz.stock) || 0), 0)}</div>
                    <div class="price">${window.getPriceRange?.(product)}</div>
                </article>
            `
            )
            .join("");
    }

    function renderProductsForEdit() {
        const productListEdit = document.getElementById("product-list-edit");
        if (!productListEdit) return;
        if (!cachedProducts.length) {
            productListEdit.innerHTML = `<p class="muted">No products yet.</p>`;
            return;
        }
        productListEdit.innerHTML = cachedProducts
            .map(
                (product) => `
                <article class="product-row" data-product-id="${product.id}">
                    <div>
                        <strong>${product.name}</strong>
                        <p class="muted">${product.category?.name || product.category || 'Uncategorized'}</p>
                    </div>
                    <div class="pill">Stock: ${product.variations?.flatMap(v => v.sizes || []).reduce((s, sz) => s + (Number(sz.stock) || 0), 0)}</div>
                    <div class="price">${window.getPriceRange?.(product)}</div>
                    <button class="btn ghost" data-edit-product>Edit</button>
                </article>
            `
            )
            .join("");
    }

    function openEditProductModal(product) {
        const modalHtml = `
    <div class="modal-overlay show" id="edit-product-modal">
        <div class="modal elevated modal-content-scrollable">
            <header class="modal-head">
                <div>
                    <p class="eyebrow">Editing</p>
                    <h2>${product.name}</h2>
                    <p class="muted">Manage details, pricing, and variations.</p>
                </div>
                <div class="modal-head__actions">
                    <button type="button" class="btn danger ghost" id="soft-delete-product">Trash</button>
                    <button class="btn ghost" type="button" onclick="closeEditModal()">Close</button>
                </div>
            </header>
            <form id="edit-product-form" class="stacked sleek-form">
                <input type="hidden" name="productId" value="${product.id}">
                
                <section class="form-section">
                    <h4 class="section-title-sm">Basic Information</h4>
                    <div class="grid-2">
                        <label>Name<input required name="name" type="text" value="${product.name}"></label>
                        <label>Category
                            <select name="category">
                                ${cachedCategories.map(cat => `<option value="${cat.name}" ${product.category?.name === cat.name || product.category === cat.name ? 'selected' : ''}>${cat.name}</option>`).join('')}
                            </select>
                        </label>
                    </div>
                    <label>Description<textarea name="description" rows="3">${product.description}</textarea></label>
                </section>

                <section class="form-section muted-bg">
                    <h4 class="section-title-sm">Marketing & Pricing</h4>
                    <div class="grid-3 align-end">
                        <label class="checkbox-wrapper">
                            <input name="featured" type="checkbox" ${product.featured ? 'checked' : ''}>
                            <span>Featured Product</span>
                        </label>
                        <label class="checkbox-wrapper">
                            <input name="sale" type="checkbox" ${product.onSale ? 'checked' : ''}>
                            <span>On Sale</span>
                        </label>
                        <label>Discount %<input name="discountPct" type="number" min="0" max="90" step="1" value="${product.discountPct || ''}"></label>
                    </div>
                </section>

                <section class="form-section">
                    <div class="flex-between">
                        <h4 class="section-title-sm">Variations & Sizes</h4>
                        <button type="button" class="btn sm ghost" id="add-edit-variation">+ Add Variation</button>
                    </div>
                    <div id="edit-variation-list" class="variation-stack">
                        ${product.variations.map(v => `
                            <div class="variation-card" data-variation-id="${v.id}">
                                <div class="variation-header">
                                    <label class="flex-grow">Variation Name (e.g. Color)<input name="variation-name" value="${v.name}" placeholder="e.g. Blue"></label>
                                    <button type="button" class="btn icon-only danger ghost" data-remove-variation title="Remove Variation">&times;</button>
                                </div>
                                <div class="size-list">
                                    ${v.sizes.map(s => `
                                        <div class="size-row" data-size-id="${s.id}">
                                            <label>Size<input name="size-label" value="${s.label}" placeholder="S, M, L"></label>
                                            <label>Price<input name="size-price" type="number" value="${s.price}" placeholder="0.00"></label>
                                            <button type="button" class="btn sm ghost danger" data-remove-size>Remove</button>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="variation-footer">
                                    <button type="button" class="btn sm ghost" data-add-size>+ Add Size</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <div class="modal-footer actions">
                    <button type="submit" class="btn full-width">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
    `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        window.closeEditModal = () => {
            document.getElementById('edit-product-modal')?.remove();
        }

        const modal = document.getElementById('edit-product-modal');
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeEditModal();
            }
        });

        const editForm = document.getElementById('edit-product-form');

        editForm.addEventListener('click', (event) => {
            const target = event.target;
            if(target.dataset.addSize) {
                const sizeList = target.closest('.variation-card').querySelector('.size-list');
                sizeList.appendChild(createSizeRow());
            }
            if(target.dataset.removeSize) {
                target.closest('.size-row').remove();
            }
            if(target.dataset.removeVariation) {
                target.closest('.variation-card').remove();
            }
        });

        document.getElementById('add-edit-variation').addEventListener('click', () => {
            const variationList = document.getElementById('edit-variation-list');
            const block = document.createElement("div");
            block.className = "variation-card";
            block.dataset.variationId = 'new_' + Date.now();
            block.innerHTML = `
            <div class="variation-header">
                <label class="flex-grow">Variation Name (e.g. Color)<input name="variation-name" value="New Variation" placeholder="e.g. Blue"></label>
                <button type="button" class="btn icon-only danger ghost" data-remove-variation title="Remove Variation">&times;</button>
            </div>
            <div class="size-list">
                ${createSizeRow({label: 'S'}).outerHTML}
            </div>
            <div class="variation-footer">
                <button type="button" class="btn sm ghost" data-add-size>+ Add Size</button>
            </div>
        `;
            variationList.appendChild(block);
        });

        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(editForm);
            const productId = fd.get('productId');
            const name = fd.get('name');
            const description = fd.get('description');
            const category = fd.get('category');
            const featured = fd.get('featured') === 'on';
            const onSale = fd.get('sale') === 'on';
            const discountPct = onSale ? Number(fd.get('discountPct') || 0) : 0;

            const variations = Array.from(document.querySelectorAll('#edit-variation-list .variation-card')).map(card => {
                const variationName = card.querySelector('input[name="variation-name"]').value;
                const sizes = Array.from(card.querySelectorAll('.size-row')).map(row => ({
                    label: row.querySelector('input[name="size-label"]').value,
                    price: Number(row.querySelector('input[name="size-price"]').value || 0)
                }));
                return { name: variationName, sizes };
            });

            try {
                await apiClient.updateProduct(productId, {
                    name,
                    description,
                    categoryName: category,
                    featured,
                    onSale,
                    discountPct,
                    variations
                });
                await loadProducts();
                closeEditModal();
            } catch (err) {
                alert('Failed to update product: ' + err.message);
            }
        });

        document.getElementById('soft-delete-product').addEventListener('click', async () => {
            if (!confirm('Move this product to trash? It can be restored within 7 days.')) return;
            try {
                await apiClient.deleteProduct(product.id);
                await Promise.all([loadProducts(), loadTrashed()]);
                closeEditModal();
            } catch (err) {
                alert('Failed to move to trash: ' + err.message);
            }
        });
    }

    document.querySelector('.admin-content')?.addEventListener('click', (event) => {
        const target = event.target;
        if ('editProduct' in target.dataset) {
            console.log('Edit button clicked');
            const productRow = target.closest('.product-row');
            const productId = productRow.dataset.productId;
            const product = cachedProducts.find(p => p.id == productId);
            if (product) {
                openEditProductModal(product);
            } else {
                console.error('Product not found for ID:', productId);
            }
        }
    });

    function renderTrash() {
        if (!trashList) return;
        if (!cachedTrashed.length) {
            trashList.innerHTML = `<p class="muted">Trash is empty. Deleted items stay for 7 days.</p>`;
            return;
        }

        trashList.innerHTML = cachedTrashed
            .map((product) => {
                const deletedAt = product.deletedAt ? new Date(product.deletedAt) : null;
                const msLeft = deletedAt ? Math.max(0, (deletedAt.getTime() + 7 * 24 * 60 * 60 * 1000) - Date.now()) : 0;
                const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
                return `
                <article class="product-row trashed" data-product-id="${product.id}">
                    <div>
                        <strong>${product.name}</strong>
                        <p class="muted">${product.category?.name || product.category || 'Uncategorized'}</p>
                        <p class="muted">Removed ${deletedAt ? deletedAt.toLocaleString() : ''}</p>
                    </div>
                    <div class="pill">Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}</div>
                    <div class="row-actions">
                        <button class="btn ghost" data-restore>Restore</button>
                        <button class="btn danger ghost" data-purge>Purge</button>
                    </div>
                </article>`;
            })
            .join("");
    }

    function renderInventory() {
        if (!inventoryGrid) return;
        if (!cachedProducts.length) {
            inventoryGrid.innerHTML = `<p class="muted">No inventory to manage.</p>`;
            return;
        }

        const productCards = cachedProducts.map((product) => {
            const totalStock = (product.variations || [])
                .flatMap((variation) => variation.sizes || [])
                .reduce((sum, size) => sum + Number(size.stock || 0), 0);

            const variationsHtml = (product.variations || [])
                .map((variation) => {
                    const sizesHtml = (variation.sizes || [])
                        .map((size) => {
                            const displayPrice = size.originalPrice ?? size.price ?? 0;
                            return `
                                <div class="inventory-size-row" data-size-id="${size.id}">
                                    <div class="size-meta">
                                        <span class="pill">${variation.name}</span>
                                        <strong>${size.label}</strong>
                                    </div>
                                    <div class="size-inputs">
                                        <label>Stock<input type="number" min="0" value="${size.stock}" data-stock-input></label>
                                        <label>Price<input type="number" min="0" step="0.01" value="${displayPrice}" data-price-input></label>
                                    </div>
                                </div>
                            `;
                        })
                        .join("");

                    return `
                        <div class="inventory-variation">
                            <div class="inventory-variation__title">${variation.name}</div>
                            <div class="inventory-sizes">${sizesHtml}</div>
                        </div>
                    `;
                })
                .join("");

            return `
                <article class="inventory-card" data-product-id="${product.id}">
                    <header class="inventory-card__head">
                        <div>
                            <strong>${product.name}</strong>
                            <p class="muted">${product.category || "Uncategorized"}</p>
                        </div>
                        <div class="inventory-card__meta">
                            <span class="pill">Total stock: ${totalStock}</span>
                            <span class="price">${window.getPriceRange?.(product)}</span>
                        </div>
                    </header>
                    <div class="inventory-variations">${variationsHtml}</div>
                    <div class="inventory-card__actions">
                        <button type="button" class="btn ghost" data-update-product>Update stock</button>
                    </div>
                </article>
            `;
        });

        inventoryGrid.innerHTML = productCards.join("");
    }

    async function loadProducts() {
        try {
            cachedProducts = await apiClient.getProducts();
            renderProducts();
            renderInventory();
            renderProductsForEdit();
            await loadTrashed();
        } catch (err) {
            if (productList) productList.innerHTML = `<p class="muted">Unable to load products: ${err.message}</p>`;
        }
    }

    async function loadTrashed() {
        if (!trashList) return;
        try {
            cachedTrashed = await apiClient.listTrashedProducts();
            renderTrash();
        } catch (err) {
            trashList.innerHTML = `<p class="muted">Unable to load trash: ${err.message}</p>`;
        }
    }

    async function loadOrdersAndCancellations() {
        try {
            const [orders, cancellations] = await Promise.all([
                apiClient.listOrders(),
                apiClient.listCancellations(),
            ]);

            if (orderList) {
                const selectedTab = document.querySelector('[data-status-tab].active')?.dataset.statusTab?.toUpperCase();
                const filteredOrders = selectedTab ? orders.filter((o) => o.status === selectedTab) : orders;
                orderList.innerHTML = filteredOrders
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
                const selectedCancelTab = document.querySelector("[data-cancel-tab].active")?.dataset.cancelTab || "PENDING";
                const filteredCancellations = cancellations.filter((req) => req.status === selectedCancelTab);
                if (!filteredCancellations.length) {
                    cancellationList.innerHTML = `<p class="muted">No ${selectedCancelTab.toLowerCase()} requests.</p>`;
                } else {
                    cancellationList.innerHTML = filteredCancellations
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
                }
            }
        } catch (err) {
            if (orderList) orderList.innerHTML = `<p class="muted">Unable to load orders: ${err.message}</p>`;
            if (cancellationList) cancellationList.innerHTML = `<p class="muted">Unable to load cancellations: ${err.message}</p>`;
        }
    }

    orderList?.addEventListener("change", async (event) => {
        const target = event.target;
        if (target instanceof HTMLSelectElement && target.dataset.action === "status") {
            const orderId = target.closest(".order-card")?.dataset.id;
            const status = target.value;
            try {
                await apiClient.updateOrderStatus(orderId, status);
                await loadOrdersAndCancellations();
            } catch (err) {
                alert(`Unable to update order: ${err.message}`);
            }
        }
    });

    document.querySelectorAll('[data-status-tab]').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            document.querySelectorAll('[data-status-tab]').forEach((b) => b.classList.remove('active'));
            event.currentTarget.classList.add('active');
            loadOrdersAndCancellations();
        });
    });

    cancellationList?.addEventListener("change", async (event) => {
        const target = event.target;
        if (target instanceof HTMLSelectElement && target.dataset.action === "cancel-status") {
            const cancelId = target.closest(".order-card")?.dataset.cancelId;
            const status = target.value;
            try {
                await apiClient.updateCancellation(cancelId, status);
                await loadOrdersAndCancellations();
            } catch (err) {
                alert(`Unable to update cancellation: ${err.message}`);
            }
        }
    });

    document.querySelectorAll("[data-status-tab]").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            document.querySelectorAll("[data-status-tab]").forEach((b) => b.classList.remove("active"));
            event.currentTarget.classList.add("active");
            loadOrdersAndCancellations();
        });
    });

    document.querySelectorAll("[data-cancel-tab]").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            document.querySelectorAll("[data-cancel-tab]").forEach((b) => b.classList.remove("active"));
            event.currentTarget.classList.add("active");
            loadOrdersAndCancellations();
        });
    });

    inventoryGrid?.addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const button = target.closest("[data-update-product]");
        if (!button) return;

        const card = button.closest("[data-product-id]");
        if (!card) return;

        const sizeRows = Array.from(card.querySelectorAll("[data-size-id]"));
        const updates = sizeRows.map((row) => {
            const id = row.dataset.sizeId;
            const stockInput = row.querySelector("[data-stock-input]");
            const priceInput = row.querySelector("[data-price-input]");
            return apiClient.updateSize(id, {
                stock: Number(stockInput?.value || 0),
                price: Number(priceInput?.value || 0),
            });
        });

        button.disabled = true;
        button.textContent = "Updating...";
        try {
            await Promise.all(updates);
            await loadProducts();
        } catch (err) {
            alert(`Unable to update inventory: ${err.message}`);
        } finally {
            button.disabled = false;
            button.textContent = "Update stock";
        }
    });

    trashList?.addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const row = target.closest("[data-product-id]");
        if (!row) return;
        const productId = row.dataset.productId;

        if (target.dataset.restore) {
            target.disabled = true;
            try {
                await apiClient.restoreProduct(productId);
                await Promise.all([loadProducts(), loadTrashed()]);
            } catch (err) {
                alert(`Unable to restore product: ${err.message}`);
            } finally {
                target.disabled = false;
            }
        }

        if (target.dataset.purge) {
            if (!confirm("Permanently delete this product? This cannot be undone.")) return;
            target.disabled = true;
            try {
                await apiClient.permanentlyDeleteProduct(productId);
                await loadTrashed();
            } catch (err) {
                alert(`Unable to delete product: ${err.message}`);
            } finally {
                target.disabled = false;
            }
        }
    });

    productForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!window.apiClient) return alert("API unavailable");
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") || "").trim();
        const description = String(fd.get("description") || "").trim();
        const base64Image = base64ImageHidden.value || null;
        const category = String(fd.get("category") || "").trim();

        const variations = Array.from(variationList?.querySelectorAll(".variation-block") || []).map((block) => {
            const variationName = block.querySelector("input[name='variation-name']")?.value || "Default";
            const sizes = Array.from(block.querySelectorAll(".size-row")).map((row) => {
                const label = row.querySelector("input[name='size-label']")?.value || "";
                const price = Number(row.querySelector("input[name='size-price']")?.value || 0);
                return { label, price };
            }).filter((s) => s.label);
            return { name: variationName, sizes };
        }).filter((v) => v.sizes.length);

        const basePrice = variations?.[0]?.sizes?.[0]?.price ?? 0;

        try {
            await apiClient.createProduct({
                name,
                description,
                imageUrl: base64Image,
                category,
                price: basePrice,
                variations,
            });
            alert("Product created");
            await loadProducts();
            productForm.reset();
            variationList.innerHTML = "";
            ensureInitialVariation();
        } catch (err) {
            alert(`Unable to create product: ${err.message}`);
        }
    });

    ensureInitialVariation();
    await Promise.all([loadCategories(), loadProducts(), loadOrdersAndCancellations()]);
})();
