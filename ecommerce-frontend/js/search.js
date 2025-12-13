(async function () {
    if (!window.apiClient) return;
    const products = await apiClient.getProducts();
    window.searchProducts = function (term) {
        const value = term.toLowerCase();
        return products.filter(
            (p) => p.name.toLowerCase().includes(value) || p.description.toLowerCase().includes(value)
        );
    };
})();
