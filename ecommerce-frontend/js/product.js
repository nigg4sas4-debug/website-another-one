(function () {
    if (!window.DataStore) return;
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id") || "minimalist-tee";
    const products = DataStore.loadProducts();
    const product = products.find((p) => p.id === productId) || products[0];

    const nameEl = document.getElementById("product-name");
    const descEl = document.getElementById("product-description");
    const priceEl = document.getElementById("product-price");
    const ratingEl = document.getElementById("product-rating");
    const categoryEl = document.getElementById("product-category");
    const galleryEl = document.getElementById("gallery");
    const variationSelect = document.getElementById("variation-select");
    const sizeSelect = document.getElementById("size-select");
    const stockCount = document.getElementById("stock-count");
    const stockAlert = document.getElementById("stock-alert");
    const addToCartBtn = document.getElementById("add-to-cart");
    const buyNowBtn = document.getElementById("buy-now");
    const relatedGrid = document.getElementById("related-grid");
    const basePriceRange = window.getPriceRange?.(product) || "$0.00";

    if (!product || !variationSelect) return;

    nameEl.textContent = product.name;
    descEl.textContent = product.description;
    ratingEl.textContent = `★ ${product.rating}`;
    categoryEl.textContent = product.category;
    priceEl.textContent = basePriceRange;

    product.variations.forEach((variation, index) => {
        const option = document.createElement("option");
        option.value = variation.name;
        option.textContent = variation.name;
        if (index === 0) option.selected = true;
        variationSelect.appendChild(option);
    });

    function renderGallery(variation) {
        if (!galleryEl) return;
        galleryEl.innerHTML = variation.gallery
            .map((entry, idx) => {
                const isImage = String(entry).startsWith("data:image") || String(entry).startsWith("http");
                const background = isImage
                    ? `url('${entry}')`
                    : `linear-gradient(135deg, ${entry}, ${variation.gallery[idx + 1] || entry})`;
                return `<div class="tile" style="background-image: ${background};"></div>`;
            })
            .join("");
    }

    function updateSizes(showSelectedPrice = false) {
        const selectedVariation = product.variations.find((v) => v.name === variationSelect.value) || product.variations[0];
        sizeSelect.innerHTML = selectedVariation.sizes
            .map((size) => `<option value="${size.label}">${size.label}</option>`)
            .join("");
        renderGallery(selectedVariation);
        updateStock(showSelectedPrice);
    }

    function updateStock(showSelectedPrice = true) {
        const variation = product.variations.find((v) => v.name === variationSelect.value) || product.variations[0];
        const size = variation.sizes.find((s) => s.label === sizeSelect.value) || variation.sizes[0];
        if (!size) return;
        stockCount.textContent = `${size.stock} in stock`;
        priceEl.textContent = showSelectedPrice ? `$${size.price.toFixed(2)}` : basePriceRange;
        const out = size.stock === 0;
        stockAlert.hidden = !out;
        addToCartBtn.disabled = out;
        buyNowBtn.disabled = out;
    }

    function addToCart(redirect) {
        const variation = product.variations.find((v) => v.name === variationSelect.value) || product.variations[0];
        const size = variation.sizes.find((s) => s.label === sizeSelect.value) || variation.sizes[0];
        const cart = DataStore.loadCart();
        const existing = cart.find((item) => item.productId === product.id && item.variation === variation.name && item.size === size.label);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({
                productId: product.id,
                name: product.name,
                variation: variation.name,
                size: size.label,
                price: size.price,
                qty: 1,
                image: variation.image,
            });
        }
        DataStore.saveCart(cart);
        window.updateCartBadges?.();
        if (redirect) {
            window.location.href = "./checkout.html";
        } else {
            addToCartBtn.textContent = "Added";
            setTimeout(() => (addToCartBtn.textContent = "Add to Cart"), 1200);
        }
    }

    variationSelect.addEventListener("change", () => updateSizes(true));
    sizeSelect.addEventListener("change", () => updateStock(true));
    addToCartBtn.addEventListener("click", () => addToCart(false));
    buyNowBtn.addEventListener("click", () => addToCart(true));

    updateSizes(false);

    if (relatedGrid) {
        const related = products.filter((p) => p.id !== product.id).slice(0, 3);
        relatedGrid.innerHTML = related.map((p) => renderProductCard(p)).join("");
    }
})();
