(async function () {
    const hamburgerMenu = document.getElementById("hamburger-menu");
    const hamburgerDropdown = document.getElementById("hamburger-dropdown");

    if (hamburgerMenu && hamburgerDropdown) {
        hamburgerMenu.addEventListener("click", function () {
            hamburgerDropdown.classList.toggle("show");
        });
    }

    // Hero rotation
    const heroSlides = document.querySelectorAll(".hero-slide");
    if (heroSlides.length > 0) {
        let index = 0;
        setInterval(() => {
            heroSlides.forEach((slide, i) => slide.classList.toggle("active", i === index));
            index = (index + 1) % heroSlides.length;
        }, 4000);
    }

    const featuredGrid = document.getElementById("featured-grid");
    const categoryGrid = document.getElementById("category-grid");

    async function hydrateProducts() {
        if (!window.apiClient) return;
        try {
            const products = await apiClient.getProducts();
            if (featuredGrid) {
                const featured = products.slice(0, 6);
                featuredGrid.innerHTML = featured.map((product) => renderProductCard(product)).join("");
            }
            if (categoryGrid) {
                const categories = [...new Set(products.map((p) => p.category || "Essentials"))];
                categoryGrid.innerHTML = categories
                    .map(
                        (category) => `
                <article class="category-card">
                    <div class="category-icon">${category.charAt(0)}</div>
                    <div>
                        <h3>${category}</h3>
                        <p>Explore curated ${category.toLowerCase()} with modern silhouettes.</p>
                    </div>
                </article>
            `
                    )
                    .join("");
            }
        } catch (err) {
            if (featuredGrid) {
                featuredGrid.innerHTML = `<p class="muted">Unable to load products from the API. ${err.message}</p>`;
            }
            if (categoryGrid) {
                categoryGrid.innerHTML = `<p class="muted">Unable to load categories.</p>`;
            }
        }
    }

    const searchForms = document.querySelectorAll(".site-search");
    searchForms.forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const value = form.querySelector("input").value.trim();
            sessionStorage.setItem("searchTerm", value);
            window.location.href = "./product-catalog.html";
        });
    });

    window.updateCartBadges = async function () {
        if (!window.apiClient) return;
        try {
            const cart = await apiClient.getCart();
            const count = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
            document.querySelectorAll("[data-cart-count]").forEach((el) => {
                el.textContent = count;
            });
        } catch (err) {
            document.querySelectorAll("[data-cart-count]").forEach((el) => {
                el.textContent = "0";
            });
        }
    };

    window.addEventListener("storage", () => window.updateCartBadges?.());

    await Promise.all([hydrateProducts(), window.updateCartBadges()]);
})();

function getPriceRange(product) {
    if (!product?.variations?.length) return "$0.00";
    const prices = product.variations.flatMap((variation) => variation.sizes?.map((size) => size.price) || []);
    const valid = prices.filter((p) => typeof p === "number");
    if (!valid.length) return "$0.00";
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    if (min === max) return `$${min.toFixed(2)}`;
    return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
}

window.getPriceRange = getPriceRange;

function renderProductCard(product) {
    const firstVariation = product.variations[0];
    const displayPrice = getPriceRange(product);
    return `
        <a class="product-card" href="./product-detail.html?id=${product.id}">
            <div class="product-image" style="background-image: url('${firstVariation.image}')"></div>
            <div class="product-body">
                <div class="product-meta">
                    <span class="pill">${product.category}</span>
                    ${product.badges?.map((b) => `<span class="pill pill-accent">${b}</span>`).join("") || ""}
                </div>
                <h3>${product.name}</h3>
                <p class="muted">${product.description}</p>
                <div class="product-footer">
                    <span class="price">${displayPrice}</span>
                    <span class="rating">★ ${product.rating}</span>
                </div>
            </div>
        </a>
    `;
}

// Load centralized footer component (replaces any existing footer with the component)
(async function loadFooter() {
    try {
        const resp = await fetch('../components/footer.html', { cache: 'no-store' });
        if (!resp.ok) return;
        const html = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newFooter = doc.querySelector('footer') || doc.body.firstElementChild;
        if (!newFooter) return;

        const existing = document.querySelector('footer.footer');
        if (existing) {
            existing.replaceWith(newFooter);
        } else {
            document.body.insertAdjacentElement('beforeend', newFooter);
        }
    } catch (err) {
        console.warn('Footer load failed', err);
    }
})();
