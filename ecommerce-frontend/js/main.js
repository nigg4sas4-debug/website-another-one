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
    const catalogGrid = document.getElementById("catalog-grid");

    const THEME_KEY = "site-theme";

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(THEME_KEY, theme);
    }

    function toggleTheme() {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(next);
    }

    (function initTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) {
            applyTheme(saved);
        }
    })();

    function ensureProfileMenu(container) {
        let menu = container.querySelector(".profile-menu");
        if (menu) return menu;
        container.insertAdjacentHTML(
            "beforeend",
            `
            <div class="profile-menu hidden">
                <button type="button" class="profile-trigger" aria-label="Profile" aria-expanded="false">
                    <span class="avatar-circle" aria-hidden="true">👤</span>
                </button>
                <div class="profile-dropdown" role="menu">
                    <div class="profile-meta">
                        <strong id="profile-email">Account</strong>
                        <p class="muted" id="profile-role"></p>
                    </div>
                    <a href="./account.html" role="menuitem">Account</a>
                    <a href="./settings.html" role="menuitem">Settings</a>
                    <button type="button" data-toggle-theme role="menuitem">Toggle theme</button>
                    <button type="button" data-logout role="menuitem" class="logout-link">Logout</button>
                </div>
            </div>
        `
        );
        return container.querySelector(".profile-menu");
    }

    async function hydrateUserNav() {
        const headerActions = document.querySelector(".header-actions");
        if (!headerActions) return;
        const profileMenu = ensureProfileMenu(headerActions);
        const trigger = profileMenu.querySelector(".profile-trigger");
        const dropdown = profileMenu.querySelector(".profile-dropdown");
        const emailEl = profileMenu.querySelector("#profile-email");
        const roleEl = profileMenu.querySelector("#profile-role");
        const logoutBtn = profileMenu.querySelector("[data-logout]");
        const themeBtn = profileMenu.querySelector("[data-toggle-theme]");

        let user = null;
        if (window.apiClient?.getToken()) {
            try {
                user = await apiClient.me();
            } catch (_) {
                // ignore
            }
        }

        const loggedIn = Boolean(user);
        emailEl.textContent = user?.email || "Welcome";
        roleEl.textContent = user?.role ? user.role.toLowerCase() : "Guest";

        const authSelectors = [
            ".header-actions a[href$='login.html']",
            ".header-actions a[href$='signup.html']",
            "#hamburger-dropdown a[href$='login.html']",
            "#hamburger-dropdown a[href$='signup.html']",
        ];
        document.querySelectorAll(authSelectors.join(",")).forEach((el) => {
            el.classList.toggle("hidden", loggedIn);
        });

        profileMenu.classList.toggle("hidden", !loggedIn);

        trigger.onclick = () => {
            const expanded = trigger.getAttribute("aria-expanded") === "true";
            trigger.setAttribute("aria-expanded", (!expanded).toString());
            dropdown.classList.toggle("show", !expanded);
        };

        document.addEventListener("click", (event) => {
            if (!profileMenu.contains(event.target)) {
                trigger.setAttribute("aria-expanded", "false");
                dropdown.classList.remove("show");
            }
        });

        logoutBtn.addEventListener("click", () => {
            if (!confirm("Log out of this account?")) return;
            apiClient?.setToken(null);
            localStorage.removeItem("profile");
            window.location.href = "./index.html";
        });

        themeBtn.addEventListener("click", toggleTheme);
    }

    async function hydrateProducts() {
        if (!window.apiClient) return;
        console.log('hydrateProducts: fetching products');
        try {
            const products = await apiClient.getProducts();
            console.log('hydrateProducts: received products', products?.length);
            if (featuredGrid) {
                const featured = products.slice(0, 6);
                featuredGrid.innerHTML = featured.map((product) => renderProductCard(product)).join("");
            }
            if (catalogGrid) {
                // support optional search term
                const term = sessionStorage.getItem("searchTerm");
                let shown = products;
                if (term) {
                    const t = term.toLowerCase();
                    shown = products.filter((p) => (p.name || "").toLowerCase().includes(t) || (p.description || "").toLowerCase().includes(t));
                    sessionStorage.removeItem("searchTerm");
                }
                catalogGrid.innerHTML = shown.map((product) => renderProductCard(product)).join("");
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

    await Promise.all([hydrateProducts(), window.updateCartBadges(), hydrateUserNav()]);
})();

function getPriceRange(product, { useOriginal = false } = {}) {
    if (!product?.variations?.length) return "$0.00";

    const priceForSize = (size) => {
        const raw = useOriginal && size.originalPrice != null ? size.originalPrice : size.price;
        return Number(raw);
    };

    const availableSizes = product.variations.flatMap((variation) =>
        variation.sizes?.filter((size) => Number(size.stock) > 0 && priceForSize(size) > 0) || []
    );

    const sourceSizes = availableSizes.length
        ? availableSizes
        : product.variations.flatMap((variation) => variation.sizes || []);

    const prices = sourceSizes.map(priceForSize).filter((p) => Number.isFinite(p) && p > 0);
    if (!prices.length) return "$0.00";

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `$${min.toFixed(2)}`;
    return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
}

window.getPriceRange = getPriceRange;

function renderProductCard(product) {
    const firstVariation = product.variations[0];
    console.log('renderProductCard image for', product.id, firstVariation?.image);
    const displayPrice = getPriceRange(product);
    const originalPrice = product.onSale ? getPriceRange(product, { useOriginal: true }) : null;
    return `
        <a class="product-card" href="./product-detail.html?id=${product.id}">
            <div class="product-image" style="background-image: url('${firstVariation.image}')"></div>
            <div class="product-body">
                <div class="product-meta">
                    <span class="pill">${product.category}</span>
                    ${product.onSale ? `<span class="pill pill-sale">Sale</span>` : ""}
                    ${product.badges?.map((b) => `<span class="pill pill-accent">${b}</span>`).join("") || ""}
                </div>
                <h3>${product.name}</h3>
                <p class="muted">${product.description}</p>
                <div class="product-footer">
                    <span class="price-group">
                        <span class="price${product.onSale ? " sale" : ""}">${displayPrice}</span>
                        ${product.onSale && originalPrice ? `<span class="price original">${originalPrice}</span>` : ""}
                    </span>
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
