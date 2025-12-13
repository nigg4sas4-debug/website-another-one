(async function () {
    if (!window.apiClient) return;
    const cartContainer = document.getElementById("cart-items") || document.getElementById("checkout-items");
    const subtotalEl = document.getElementById("cart-subtotal") || document.getElementById("checkout-subtotal");
    const totalEl = document.getElementById("checkout-total");
    const countEl = document.getElementById("cart-count");
    const continueBtn = document.getElementById("continue-shopping");
    const form = document.getElementById("checkout-form");

    async function loadCart() {
        try {
            return await apiClient.getCart();
        } catch (err) {
            if (cartContainer) {
                cartContainer.innerHTML = `<p class="muted">Please log in to view your cart.</p>`;
            }
            return [];
        }
    }

    async function renderCart() {
        const cart = await loadCart();
        if (!cartContainer) return;
        if (cart.length === 0) {
            cartContainer.innerHTML = `<p class="muted">Your cart is empty.</p>`;
        } else {
            cartContainer.innerHTML = cart
                .map(
                    (item) => `
                <article class="cart-item">
                    <div class="cart-thumb" style="background-image: url('${item.image}')"></div>
                    <div class="cart-meta">
                        <h3>${item.name}</h3>
                        <p class="muted">${item.variation} • Size ${item.size}</p>
                        <div class="cart-actions" data-id="${item.cartItemId}">
                            <label>Qty <input type="number" min="1" value="${item.qty}"></label>
                            <button class="link" data-action="remove">Remove</button>
                        </div>
                    </div>
                    <div class="price">$${(item.price * item.qty).toFixed(2)}</div>
                </article>
            `
                )
                .join("");
        }
        updateTotals(cart);
    }

    function updateTotals(cart) {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (countEl) countEl.textContent = String(cart.reduce((sum, item) => sum + item.qty, 0));
        window.updateCartBadges?.();
    }

    cartContainer?.addEventListener("change", async (event) => {
        const target = event.target;
        if (target.tagName === "INPUT") {
            const itemId = Number(target.closest(".cart-actions")?.dataset.id);
            if (itemId) {
                const qty = Math.max(1, Number(target.value));
                try {
                    const cart = await apiClient.updateCartItem(itemId, qty);
                    updateTotals(cart);
                    await renderCart();
                } catch (err) {
                    alert(`Unable to update cart: ${err.message}`);
                }
            }
        }
    });

    cartContainer?.addEventListener("click", async (event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.dataset.action === "remove") {
            const itemId = Number(target.closest(".cart-actions")?.dataset.id);
            if (itemId) {
                try {
                    const cart = await apiClient.removeCartItem(itemId);
                    updateTotals(cart);
                    await renderCart();
                } catch (err) {
                    alert(`Unable to remove item: ${err.message}`);
                }
            }
        }
    });

    continueBtn?.addEventListener("click", () => {
        window.location.href = "./product-catalog.html";
    });

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const cart = await loadCart();
        if (cart.length === 0) {
            alert("Add items to your cart before checking out.");
            return;
        }
        const data = new FormData(form);
        const shipping = {
            name: data.get("name"),
            email: data.get("email"),
            phone: data.get("phone"),
            address: data.get("address"),
            city: data.get("city"),
            zip: data.get("zip"),
        };
        try {
            const order = await apiClient.createOrder(shipping);
            alert(`Order ${order.id} placed!`);
            window.location.href = "./order-tracking.html";
        } catch (err) {
            alert(`Checkout failed: ${err.message}`);
        }
    });

    await renderCart();
})();
