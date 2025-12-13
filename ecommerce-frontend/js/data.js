const API_BASE = window.API_BASE || window.location.origin;
const AUTH_TOKEN_KEY = "authToken";

const ImageFactory = {
    createPlaceholder(title, colors = ["#4c6fff", "#7ce7ac"]) {
        const [start, end] = colors;
        const encodedTitle = encodeURIComponent(title);
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260'>` +
            `<defs><linearGradient id='grad' x1='0' y1='0' x2='1' y2='1'>` +
            `<stop offset='0%' stop-color='${start}'/><stop offset='100%' stop-color='${end}'/></linearGradient></defs>` +
            `<rect width='400' height='260' fill='url(%23grad)' rx='12'/>` +
            `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='24' font-weight='700'>${encodedTitle}</text>` +
            `</svg>`;
    }
};

function getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || null;
}

function setToken(token) {
    if (!token) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        return;
    }
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

async function apiRequest(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        setToken(null);
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const message = data?.message || `Request failed with status ${response.status}`;
        throw new Error(message);
    }

    return data;
}

function normalizeProduct(product) {
    const image = product.imageUrl || ImageFactory.createPlaceholder(product.name || "Product");
    return {
        id: String(product.id),
        name: product.name,
        description: product.description,
        category: product.category || "Essentials",
        price: product.price,
        rating: product.rating || 4.5,
        featured: product.featured ?? true,
        available: (product.stock ?? 0) > 0,
        badges: product.badges || [],
        variations: [
            {
                name: "Default",
                image,
                gallery: [image],
                sizes: [
                    {
                        label: "OS",
                        stock: product.stock ?? 0,
                        price: product.price,
                    },
                ],
            },
        ],
    };
}

function mapCartItem(item) {
    const product = normalizeProduct(item.product);
    const variation = product.variations[0];
    const size = variation.sizes[0];
    return {
        productId: product.id,
        name: product.name,
        variation: variation.name,
        size: size.label,
        price: size.price,
        qty: item.quantity,
        image: variation.image,
        cartItemId: item.id,
    };
}

const apiClient = {
    getToken,
    setToken,
    async login(email, password) {
        const data = await apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
        setToken(data.token);
        return data.user;
    },
    async register(email, password) {
        const data = await apiRequest("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
        setToken(data.token);
        return data.user;
    },
    async me() {
        return apiRequest("/me", { method: "GET" });
    },
    async getProducts() {
        const products = await apiRequest("/products", { method: "GET" });
        return products.map(normalizeProduct);
    },
    async getProduct(id) {
        const product = await apiRequest(`/products/${id}`, { method: "GET" });
        return normalizeProduct(product);
    },
    async getCart() {
        const cart = await apiRequest("/cart", { method: "GET" });
        return cart.items.map(mapCartItem);
    },
    async addToCart(productId, quantity = 1) {
        const cart = await apiRequest("/cart/items", { method: "POST", body: JSON.stringify({ productId: Number(productId), quantity }) });
        return cart.items.map(mapCartItem);
    },
    async updateCartItem(itemId, quantity) {
        const cart = await apiRequest(`/cart/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
        return cart.items.map(mapCartItem);
    },
    async removeCartItem(itemId) {
        const cart = await apiRequest(`/cart/items/${itemId}`, { method: "DELETE" });
        return cart.items.map(mapCartItem);
    },
    async createOrder(shipping) {
        const order = await apiRequest("/orders", { method: "POST", body: JSON.stringify({ shipping }) });
        return order;
    },
    async listOrders() {
        const orders = await apiRequest("/orders", { method: "GET" });
        return orders;
    },
    async getOrder(id) {
        return apiRequest(`/orders/${id}`, { method: "GET" });
    },
    async cancelOrder(id) {
        return apiRequest(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: "CANCELLED" }) });
    },
    async updateOrderStatus(id, status) {
        return apiRequest(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    },
};

window.apiClient = apiClient;
window.ImageFactory = ImageFactory;
