(function () {
    if (!window.DataStore) return;
    const cartContainer = document.getElementById("cart-items") || document.getElementById("checkout-items");
    const subtotalEl = document.getElementById("cart-subtotal") || document.getElementById("checkout-subtotal");
    const totalEl = document.getElementById("checkout-total");
    const countEl = document.getElementById("cart-count");
    const continueBtn = document.getElementById("continue-shopping");
    const form = document.getElementById("checkout-form");

    function renderCart() {
        const cart = DataStore.loadCart();
        if (!cartContainer) return;
        if (cart.length === 0) {
            cartContainer.innerHTML = `<p class="muted">Your cart is empty.</p>`;
        } else {
            cartContainer.innerHTML = cart
                .map(
                    (item, index) => `
                <article class="cart-item">
                    <div class="cart-thumb" style="background-image: url('${item.image}')"></div>
                    <div class="cart-meta">
                        <h3>${item.name}</h3>
                        <p class="muted">${item.variation} • Size ${item.size}</p>
                        <div class="cart-actions" data-index="${index}">
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
        updateTotals();
    }

    function updateTotals() {
        const cart = DataStore.loadCart();
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (countEl) countEl.textContent = String(cart.reduce((sum, item) => sum + item.qty, 0));
        window.updateCartBadges?.();
    }

    cartContainer?.addEventListener("change", (event) => {
        const target = event.target;
        if (target.tagName === "INPUT") {
            const index = Number(target.closest(".cart-actions")?.dataset.index);
            const cart = DataStore.loadCart();
            if (cart[index]) {
                cart[index].qty = Math.max(1, Number(target.value));
                DataStore.saveCart(cart);
                renderCart();
            }
        }
    });

    cartContainer?.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.dataset.action === "remove") {
            const index = Number(target.closest(".cart-actions")?.dataset.index);
            const cart = DataStore.loadCart();
            cart.splice(index, 1);
            DataStore.saveCart(cart);
            renderCart();
        }
    });

    continueBtn?.addEventListener("click", () => {
        window.location.href = "./product-catalog.html";
    });

    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        const cart = DataStore.loadCart();
        if (cart.length === 0) {
            alert("Add items to your cart before checking out.");
            return;
        }
        const data = new FormData(form);
        const orderId = `ORD-${Math.floor(Math.random() * 9000 + 1000)}`;
        const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        const order = {
            id: orderId,
            customer: data.get("name") || "Guest",
            email: data.get("email") || "",
            phone: data.get("phone") || "",
            address: data.get("address") || "",
            city: data.get("city") || "",
            zip: data.get("zip") || "",
            items: cart,
            status: "Pending",
            total,
            eta: "Aug 28, 2024",
        };
        const orders = DataStore.loadOrders();
        orders.unshift(order);
        DataStore.saveOrders(orders);
        DataStore.saveCart([]);
        alert(`Order ${orderId} placed!`);
        window.location.href = "./order-tracking.html";
    });

    renderCart();
})();
