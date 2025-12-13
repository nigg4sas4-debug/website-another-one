(function () {
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
    if (featuredGrid && window.DataStore) {
        const products = DataStore.loadProducts();
        const featured = products.filter((p) => p.featured).slice(0, 6);
        featuredGrid.innerHTML = featured
            .map((product) => renderProductCard(product))
            .join("");
    }

    const categoryGrid = document.getElementById("category-grid");
    if (categoryGrid && window.DataStore) {
        const products = DataStore.loadProducts();
        const categories = [...new Set(products.map((p) => p.category))];
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

    const searchForms = document.querySelectorAll(".site-search");
    searchForms.forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const value = form.querySelector("input").value.trim();
            sessionStorage.setItem("searchTerm", value);
            window.location.href = "./product-catalog.html";
        });
    });

    window.updateCartBadges = function () {
        if (!window.DataStore) return;
        const cart = DataStore.loadCart();
        const count = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
        document.querySelectorAll("[data-cart-count]").forEach((el) => {
            el.textContent = count;
        });
    };

    window.addEventListener("storage", () => window.updateCartBadges?.());
    window.updateCartBadges();
})();

function renderProductCard(product) {
    const firstVariation = product.variations[0];
    const displayPrice = firstVariation?.sizes?.[0]?.price ?? product.price;
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
                    <span class="price">$${displayPrice.toFixed(2)}</span>
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
