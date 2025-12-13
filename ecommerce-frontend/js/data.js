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

const defaultProducts = [
    {
        id: "minimalist-tee",
        name: "Minimalist Tee",
        category: "Shirts",
        price: 28,
        description: "Soft cotton tee with breathable fabric and a clean silhouette for everyday wear.",
        featured: true,
        available: true,
        badges: ["New", "Organic"],
        rating: 4.5,
        variations: [
            {
                name: "Plain",
                image: ImageFactory.createPlaceholder("Plain Tee", ["#1f4b99", "#73b6ff"]),
                gallery: ["#1f4b99", "#73b6ff"],
                sizes: [
                    { label: "S", stock: 6, price: 28 },
                    { label: "M", stock: 12, price: 28 },
                    { label: "L", stock: 5, price: 28 }
                ]
            },
            {
                name: "Japanese Print",
                image: ImageFactory.createPlaceholder("Jap Print", ["#003f5c", "#ffa600"]),
                gallery: ["#003f5c", "#ffa600"],
                sizes: [
                    { label: "S", stock: 2, price: 32 },
                    { label: "M", stock: 10, price: 32 },
                    { label: "L", stock: 0, price: 32 }
                ]
            },
            {
                name: "Anime Print",
                image: ImageFactory.createPlaceholder("Anime", ["#ef476f", "#ffd166"]),
                gallery: ["#ef476f", "#ffd166"],
                sizes: [
                    { label: "S", stock: 9, price: 34 },
                    { label: "M", stock: 4, price: 34 },
                    { label: "L", stock: 1, price: 34 }
                ]
            }
        ]
    },
    {
        id: "denim-jacket",
        name: "Denim Jacket",
        category: "Jackets",
        price: 72,
        description: "Structured denim jacket with contrast stitching and inner lining for cooler evenings.",
        featured: true,
        available: true,
        badges: ["Best Seller"],
        rating: 4.8,
        variations: [
            {
                name: "Indigo",
                image: ImageFactory.createPlaceholder("Indigo", ["#264653", "#2a9d8f"]),
                gallery: ["#264653", "#2a9d8f"],
                sizes: [
                    { label: "S", stock: 4, price: 72 },
                    { label: "M", stock: 8, price: 72 },
                    { label: "L", stock: 6, price: 72 }
                ]
            },
            {
                name: "Washed",
                image: ImageFactory.createPlaceholder("Washed", ["#557a95", "#c9d6df"]),
                gallery: ["#557a95", "#c9d6df"],
                sizes: [
                    { label: "S", stock: 2, price: 75 },
                    { label: "M", stock: 5, price: 75 },
                    { label: "L", stock: 0, price: 75 }
                ]
            }
        ]
    },
    {
        id: "tailored-trousers",
        name: "Tailored Trousers",
        category: "Trousers",
        price: 54,
        description: "Slim-cut trousers with four-way stretch and a clean taper for the office or weekend.",
        featured: false,
        available: true,
        badges: ["Stretch"],
        rating: 4.2,
        variations: [
            {
                name: "Black",
                image: ImageFactory.createPlaceholder("Black", ["#0f0f0f", "#3a3a3a"]),
                gallery: ["#0f0f0f", "#3a3a3a"],
                sizes: [
                    { label: "30", stock: 10, price: 54 },
                    { label: "32", stock: 12, price: 54 },
                    { label: "34", stock: 7, price: 54 }
                ]
            },
            {
                name: "Charcoal",
                image: ImageFactory.createPlaceholder("Charcoal", ["#3d405b", "#81b29a"]),
                gallery: ["#3d405b", "#81b29a"],
                sizes: [
                    { label: "30", stock: 5, price: 56 },
                    { label: "32", stock: 0, price: 56 },
                    { label: "34", stock: 3, price: 56 }
                ]
            }
        ]
    },
    {
        id: "linen-shirt",
        name: "Linen Resort Shirt",
        category: "Shirts",
        price: 48,
        description: "Lightweight linen shirt with camp collar and airy weave for sunny days.",
        featured: true,
        available: true,
        badges: ["Breezy"],
        rating: 4.3,
        variations: [
            {
                name: "Sand",
                image: ImageFactory.createPlaceholder("Sand", ["#f4a261", "#e9c46a"]),
                gallery: ["#f4a261", "#e9c46a"],
                sizes: [
                    { label: "S", stock: 8, price: 48 },
                    { label: "M", stock: 6, price: 48 },
                    { label: "L", stock: 5, price: 48 }
                ]
            },
            {
                name: "Sea",
                image: ImageFactory.createPlaceholder("Sea", ["#0096c7", "#90e0ef"]),
                gallery: ["#0096c7", "#90e0ef"],
                sizes: [
                    { label: "S", stock: 3, price: 50 },
                    { label: "M", stock: 0, price: 50 },
                    { label: "L", stock: 1, price: 50 }
                ]
            }
        ]
    },
    {
        id: "performance-hoodie",
        name: "Performance Hoodie",
        category: "Jackets",
        price: 64,
        description: "Moisture-wicking hoodie with bonded seams and roomy kangaroo pocket.",
        featured: false,
        available: true,
        badges: ["Athletic"],
        rating: 4.6,
        variations: [
            {
                name: "Slate",
                image: ImageFactory.createPlaceholder("Slate", ["#14213d", "#8d99ae"]),
                gallery: ["#14213d", "#8d99ae"],
                sizes: [
                    { label: "S", stock: 9, price: 64 },
                    { label: "M", stock: 7, price: 64 },
                    { label: "L", stock: 4, price: 64 }
                ]
            },
            {
                name: "Olive",
                image: ImageFactory.createPlaceholder("Olive", ["#606c38", "#bc6c25"]),
                gallery: ["#606c38", "#bc6c25"],
                sizes: [
                    { label: "S", stock: 5, price: 66 },
                    { label: "M", stock: 2, price: 66 },
                    { label: "L", stock: 0, price: 66 }
                ]
            }
        ]
    }
];

const defaultOrders = [
    {
        id: "ORD-1046",
        customer: "Maya Patel",
        email: "maya@eternaluxe.com",
        phone: "(555) 321-4567",
        address: "88 North Ave",
        city: "Seattle",
        zip: "98101",
        items: [
            { productId: "minimalist-tee", name: "Minimalist Tee", variation: "Anime Print", size: "M", qty: 1, price: 34 }
        ],
        status: "Processing",
        total: 34,
        eta: "Aug 24, 2024"
    },
    {
        id: "ORD-1047",
        customer: "Liam Chen",
        email: "liam@eternaluxe.com",
        phone: "(555) 654-9999",
        address: "215 Lake View",
        city: "Austin",
        zip: "73301",
        items: [
            { productId: "denim-jacket", name: "Denim Jacket", variation: "Indigo", size: "M", qty: 1, price: 72 }
        ],
        status: "Pending",
        total: 72,
        eta: "Aug 26, 2024"
    }
];

function loadProducts() {
    const saved = localStorage.getItem("products");
    if (saved) {
        return JSON.parse(saved);
    }
    localStorage.setItem("products", JSON.stringify(defaultProducts));
    return JSON.parse(JSON.stringify(defaultProducts));
}

function saveProducts(list) {
    localStorage.setItem("products", JSON.stringify(list));
}

function loadOrders() {
    const saved = localStorage.getItem("orders");
    if (saved) {
        return JSON.parse(saved);
    }
    localStorage.setItem("orders", JSON.stringify(defaultOrders));
    return JSON.parse(JSON.stringify(defaultOrders));
}

function saveOrders(list) {
    localStorage.setItem("orders", JSON.stringify(list));
}

function loadCart() {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

window.DataStore = {
    loadProducts,
    saveProducts,
    loadOrders,
    saveOrders,
    loadCart,
    saveCart,
};

window.ImageFactory = ImageFactory;
