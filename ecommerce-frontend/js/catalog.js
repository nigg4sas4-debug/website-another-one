(async function () {
    if (!window.apiClient) return;

    const catalogGrid = document.getElementById("catalog-grid");
    const categoryContainer = document.getElementById("category-filters");
    const priceSlider = document.getElementById("filter-price");
    const priceValue = document.getElementById("price-value");
    const clearBtn = document.getElementById("clear-filters");
    const sortButtons = document.querySelectorAll("[data-sort]");

    let allProducts = [];
    let activeCategories = new Set();
    let maxPrice = 500;
    let currentSort = "new"; // 'new', 'price-asc', 'price-desc'
    let searchTerm = null;

    async function init() {
        try {
            // Check for search term
            if (sessionStorage.getItem("searchTerm")) {
                searchTerm = sessionStorage.getItem("searchTerm").toLowerCase();
                sessionStorage.removeItem("searchTerm");
                
                // If search term exists, maybe show a "Searching for: ..." UI?
                // For now just filtering is enough.
            }

            // Fetch data
            const [products, categories] = await Promise.all([
                window.apiClient.getProducts(),
                window.apiClient.listCategories()
            ]);
            
            allProducts = products;

            // Initialize price slider max based on products
            const maxProductPrice = Math.max(...products.map(p => Number(p.price)), 100);
            priceSlider.max = Math.ceil(maxProductPrice / 10) * 10;
            priceSlider.value = priceSlider.max;
            maxPrice = Number(priceSlider.value);
            priceValue.textContent = `$${maxPrice}`;

            // Render Categories
            renderCategories(categories);

            // Initial Render
            applyFilters();
        } catch (err) {
            console.error("Failed to load catalog data", err);
            catalogGrid.innerHTML = `<p class="muted">Failed to load products. Please try again later.</p>`;
        }
    }

    function renderCategories(categories) {
        if (!categories || categories.length === 0) {
            categoryContainer.innerHTML = '<p class="muted">No categories found.</p>';
            return;
        }

        categoryContainer.innerHTML = categories.map(cat => `
            <label class="checkbox-row">
                <input type="checkbox" value="${cat.name}" class="category-checkbox">
                <span>${cat.name}</span>
            </label>
        `).join('');

        // Add listeners to new checkboxes
        categoryContainer.querySelectorAll('.category-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                if (e.target.checked) {
                    activeCategories.add(e.target.value);
                } else {
                    activeCategories.delete(e.target.value);
                }
                applyFilters();
            });
        });
    }

    function applyFilters() {
        
        // 1. Filter
        let filtered = allProducts.filter(p => {
            // Search Filter
            if (searchTerm) {
                const matchName = p.name.toLowerCase().includes(searchTerm);
                const matchDesc = p.description.toLowerCase().includes(searchTerm);
                if (!matchName && !matchDesc) return false;
            }

            // Category Filter (OR logic)
            if (activeCategories.size > 0 && !activeCategories.has(p.category)) {
                return false;
            }
            // Price Filter
            if (Number(p.price) > maxPrice) {
                return false;
            }
            return true;
        });

        // 2. Sort
        filtered.sort((a, b) => {
            if (currentSort === 'price-asc') {
                return Number(a.price) - Number(b.price);
            } else if (currentSort === 'price-desc') {
                return Number(b.price) - Number(a.price);
            } else if (currentSort === 'new') {
                return Number(b.id) - Number(a.id);
            }
            return 0;
        });

        renderGrid(filtered);
    }

    function renderGrid(products) {
        if (products.length === 0) {
            catalogGrid.innerHTML = `<div class="empty-state"><p class="muted">No products match your filters.</p></div>`;
            return;
        }
        
        // Use global renderProductCard from main.js if available
        if (window.renderProductCard) {
            catalogGrid.innerHTML = products.map(p => window.renderProductCard(p)).join('');
        } else {
            catalogGrid.innerHTML = `<p class="muted">Error: Renderer not loaded.</p>`;
        }
    }

    // Event Listeners
    priceSlider.addEventListener('input', (e) => {
        maxPrice = Number(e.target.value);
        priceValue.textContent = `$${maxPrice}`;
        applyFilters();
    });

    clearBtn.addEventListener('click', () => {
        searchTerm = null;
        activeCategories.clear();
        categoryContainer.querySelectorAll('input').forEach(i => i.checked = false);
        priceSlider.value = priceSlider.max;
        maxPrice = Number(priceSlider.max);
        priceValue.textContent = `$${maxPrice}`;
        currentSort = 'new';
        updateSortButtons();
        applyFilters();
    });

    sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentSort = btn.dataset.sort;
            updateSortButtons();
            applyFilters();
        });
    });

    function updateSortButtons() {
        sortButtons.forEach(btn => {
            if (btn.dataset.sort === currentSort) {
                btn.classList.add('active'); // Style this class in CSS
                btn.style.borderColor = 'var(--accent)';
                btn.style.color = 'var(--accent)';
            } else {
                btn.classList.remove('active');
                btn.style.borderColor = '';
                btn.style.color = '';
            }
        });
    }

    // Initialize
    init();

})();
