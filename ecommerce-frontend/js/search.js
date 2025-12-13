(function () {
    if (!window.DataStore) return;
    const products = DataStore.loadProducts();
    const catalogGrid = document.getElementById("catalog-grid");
    const categorySelect = document.getElementById("filter-category");
    const sizeSelect = document.getElementById("filter-size");
    const availabilitySelect = document.getElementById("filter-availability");
    const priceRange = document.getElementById("filter-price");
    const priceValue = document.getElementById("price-value");
    const clearFilters = document.getElementById("clear-filters");
    const chips = document.querySelectorAll(".chip");

    if (!catalogGrid) return;

    const categories = [...new Set(products.map((p) => p.category))];
    categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect?.appendChild(option);
    });

    function matchesFilters(product) {
        const searchTerm = (sessionStorage.getItem("searchTerm") || "").toLowerCase();
        const bySearch = !searchTerm || product.name.toLowerCase().includes(searchTerm) || product.description.toLowerCase().includes(searchTerm);
        const byCategory = !categorySelect?.value || product.category === categorySelect.value;
        const byAvailability = (() => {
            if (!availabilitySelect?.value) return true;
            const hasStock = product.variations.some((variation) => variation.sizes.some((size) => size.stock > 0));
            return availabilitySelect.value === "in" ? hasStock : !hasStock;
        })();
        const byPrice = (() => {
            const maxPrice = Number(priceRange?.value || 100);
            const smallest = Math.min(...product.variations.flatMap((v) => v.sizes.map((s) => s.price)));
            return smallest <= maxPrice;
        })();
        const bySize = (() => {
            if (!sizeSelect?.value) return true;
            return product.variations.some((variation) => variation.sizes.some((s) => s.label === sizeSelect.value));
        })();
        return bySearch && byCategory && byAvailability && byPrice && bySize;
    }

    function render(list) {
        catalogGrid.innerHTML = list.map((p) => renderProductCard(p)).join("");
    }

    function applyFilters() {
        const filtered = products.filter(matchesFilters);
        const sort = document.querySelector(".chip.active")?.dataset.sort;
        if (sort === "price-asc") {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sort === "price-desc") {
            filtered.sort((a, b) => b.price - a.price);
        }
        render(filtered);
    }

    categorySelect?.addEventListener("change", applyFilters);
    sizeSelect?.addEventListener("change", applyFilters);
    availabilitySelect?.addEventListener("change", applyFilters);
    priceRange?.addEventListener("input", () => {
        priceValue.textContent = `$${priceRange.value}`;
        applyFilters();
    });

    chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            chips.forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
            applyFilters();
        });
    });

    clearFilters?.addEventListener("click", () => {
        if (categorySelect) categorySelect.value = "";
        if (sizeSelect) sizeSelect.value = "";
        if (availabilitySelect) availabilitySelect.value = "";
        if (priceRange) priceRange.value = 100;
        priceValue.textContent = "$100";
        sessionStorage.removeItem("searchTerm");
        chips.forEach((c) => c.classList.remove("active"));
        applyFilters();
    });

    applyFilters();
})();
