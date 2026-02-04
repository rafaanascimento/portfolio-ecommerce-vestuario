const cartKey = "urbanwear-cart";
const couponKey = "urbanwear-coupon";
const themeKey = "urbanwear-theme";
const shippingCost = 20;

const cartService = {
  getCart() {
    const stored = localStorage.getItem(cartKey);
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      localStorage.removeItem(cartKey);
      return [];
    }
  },
  saveCart(cart) {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  },
  addItem(product) {
    const cart = this.getCart();
    const existingItem = cart.find((item) => String(item.id) === String(product.id));

    if (existingItem) {
      existingItem.quantidade += 1;
    } else {
      cart.push({ ...product, quantidade: 1 });
    }

    this.saveCart(cart);
  },
  removeItem(productId) {
    const cart = this.getCart().filter((item) => String(item.id) !== String(productId));
    this.saveCart(cart);
  },
  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const item = cart.find((entry) => String(entry.id) === String(productId));

    if (!item) return;

    item.quantidade = Math.max(1, quantity);
    this.saveCart(cart);
  },
  clearCart() {
    localStorage.removeItem(cartKey);
  },
  getTotalItems() {
    return this.getCart().reduce((total, item) => total + item.quantidade, 0);
  },
  getSubtotal() {
    return this.getCart().reduce(
      (total, item) => total + item.preco * item.quantidade,
      0
    );
  },
  getTotalWithShipping() {
    const subtotal = this.getSubtotal();
    return subtotal > 0 ? subtotal + shippingCost : 0;
  },
};

const couponService = {
  getCoupon() {
    return localStorage.getItem(couponKey) || "";
  },
  saveCoupon(code) {
    localStorage.setItem(couponKey, code);
  },
  clearCoupon() {
    localStorage.removeItem(couponKey);
  },
  getDiscount(subtotal) {
    const code = this.getCoupon();
    if (code === "URBAN10") {
      return subtotal * 0.1;
    }
    return 0;
  },
  getShippingCost() {
    const code = this.getCoupon();
    return code === "FRETEGRATIS" ? 0 : shippingCost;
  },
  isValid(code) {
    return ["URBAN10", "FRETEGRATIS"].includes(code);
  },
};

const themeService = {
  getTheme() {
    return localStorage.getItem(themeKey) || "dark";
  },
  toggleTheme() {
    const next = this.getTheme() === "dark" ? "light" : "dark";
    localStorage.setItem(themeKey, next);
    return next;
  },
  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  },
};

const uiService = {
  formatCurrency(value) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  },
  updateCartCounter() {
    const counter = document.querySelector("#cart-count");
    if (!counter) return;
    counter.textContent = cartService.getTotalItems();
  },
  renderCartItems() {
    const cartList = document.querySelector("[data-cart-items]");
    const emptyState = document.querySelector("[data-cart-empty]");

    if (!cartList || !emptyState) return;

    const cart = cartService.getCart();
    cartList.innerHTML = "";

    if (!cart.length) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    cart.forEach((item) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      const decreaseDisabled = item.quantidade <= 1 ? "disabled" : "";
      li.innerHTML = `
        <div class="cart-item-image">
          <img src="${item.imagem}" alt="${item.nome}" />
        </div>
        <div class="cart-item-info">
          <h3>${item.nome}</h3>
          <p class="muted">${this.formatCurrency(item.preco)} cada</p>
          <div class="cart-quantity">
            <button class="qty-btn" data-action="decrease" data-id="${item.id}" ${decreaseDisabled}>-</button>
            <span>${item.quantidade}</span>
            <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
          </div>
        </div>
        <div class="cart-item-actions">
          <p class="subtotal">${this.formatCurrency(
            item.preco * item.quantidade
          )}</p>
          <button class="btn outline" data-action="remove" data-id="${
            item.id
          }">Remover item</button>
        </div>
      `;
      cartList.appendChild(li);
    });
  },
  renderTotals() {
    const subtotalEl = document.querySelector("[data-cart-subtotal]");
    const shippingEl = document.querySelector("[data-cart-shipping]");
    const discountEl = document.querySelector("[data-cart-discount]");
    const totalEl = document.querySelector("[data-cart-total]");
    const checkoutButton = document.querySelector("[data-checkout]");

    if (!subtotalEl || !shippingEl || !totalEl) return;

    const hasItems = cartService.getTotalItems() > 0;
    const subtotal = cartService.getSubtotal();
    const discount = couponService.getDiscount(subtotal);
    const shipping = couponService.getShippingCost();
    const total = hasItems ? subtotal - discount + shipping : 0;

    subtotalEl.textContent = this.formatCurrency(subtotal);
    shippingEl.textContent = this.formatCurrency(shipping);
    if (discountEl) {
      discountEl.textContent = this.formatCurrency(discount);
    }
    totalEl.textContent = this.formatCurrency(total);

    if (checkoutButton) {
      checkoutButton.disabled = !hasItems;
    }
  },
  showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });
    setTimeout(() => toast.classList.remove("show"), 2200);
  },
};

const bindAddToCartButtons = () => {
  const buttons = document.querySelectorAll(".btn-add-cart");
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const product = {
        id: button.dataset.id,
        nome: button.dataset.nome,
        preco: Number(button.dataset.preco),
        imagem: button.dataset.imagem,
      };

      cartService.addItem(product);
      uiService.updateCartCounter();
      uiService.showToast("Produto adicionado ao carrinho!");
    });
  });
};

const bindCouponActions = () => {
  const input = document.querySelector("[data-coupon-input]");
  const button = document.querySelector("[data-apply-coupon]");
  const feedback = document.querySelector("[data-coupon-feedback]");

  if (!input || !button) return;

  const currentCoupon = couponService.getCoupon();
  if (currentCoupon) {
    input.value = currentCoupon;
  }

  button.addEventListener("click", () => {
    const code = input.value.trim().toUpperCase();

    if (!code) {
      couponService.clearCoupon();
      uiService.renderTotals();
      if (feedback) feedback.textContent = "Cupom removido.";
      return;
    }

    if (!couponService.isValid(code)) {
      if (feedback) feedback.textContent = "Cupom inválido.";
      return;
    }

    couponService.saveCoupon(code);
    uiService.renderTotals();
    if (feedback) feedback.textContent = `Cupom aplicado: ${code}.`;
  });
};

const updateThemeToggleIcons = (theme) => {
  document.querySelectorAll("[data-theme-toggle]").forEach((toggle) => {
    toggle.textContent = theme === "dark" ? "🌙" : "☀️";
  });
};

const bindThemeToggle = () => {
  const toggles = document.querySelectorAll("[data-theme-toggle]");
  if (!toggles.length) return;

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const nextTheme = themeService.toggleTheme();
      themeService.applyTheme(nextTheme);
      updateThemeToggleIcons(nextTheme);
    });
  });
};

const bindProductDetail = async () => {
  const imageEl = document.querySelector("[data-product-image]");
  const nameEl = document.querySelector("[data-product-name]");
  const descEl = document.querySelector("[data-product-description]");
  const priceEl = document.querySelector("[data-product-price]");
  const collectionEl = document.querySelector("[data-product-collection]");
  const addButton = document.querySelector("[data-add-to-cart]");

  if (!imageEl || !nameEl || !descEl || !priceEl || !addButton) return;

  const products = await apiService.getProducts();
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id") || products[0].id;
  const product = products.find((item) => item.id === productId) || products[0];

  imageEl.src = product.imagem;
  imageEl.alt = product.nome;
  nameEl.textContent = product.nome;
  descEl.textContent = product.descricao;
  priceEl.textContent = uiService.formatCurrency(product.preco);
  if (collectionEl) {
    collectionEl.textContent = product.colecao;
  }

  addButton.dataset.id = product.id;
  addButton.dataset.nome = product.nome;
  addButton.dataset.preco = product.preco;
  addButton.dataset.imagem = product.imagem;
};

const renderProductCards = (products, container, options = {}) => {
  if (!container) return;

  const { limit } = options;
  const slice = limit ? products.slice(0, limit) : products;
  container.innerHTML = slice
    .map(
      (product) => `
      <article class="product-card">
        <img src="${product.imagem}" alt="${product.nome}" />
        <div class="product-info">
          <h3>${product.nome}</h3>
          <p class="price">${uiService.formatCurrency(product.preco)}</p>
          <a class="btn outline" href="produto.html?id=${product.id}">Ver Produto</a>
        </div>
      </article>
    `
    )
    .join("");
};

const initProducts = async () => {
  const featuredContainer = document.querySelector("[data-featured-products]");
  const listContainer = document.querySelector("[data-product-list]");
  if (!featuredContainer && !listContainer) return;

  const products = await apiService.getProducts();
  if (featuredContainer) {
    renderProductCards(products, featuredContainer, { limit: 3 });
  }
  if (listContainer) {
    renderProductCards(products, listContainer);
  }
};

const bindCartActions = () => {
  const cartContainer = document.querySelector("[data-cart-container]");
  const checkoutButton = document.querySelector("[data-checkout]");

  if (!cartContainer) return;

  cartContainer.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const { action, id } = target.dataset;
    if (!action || !id) return;

    if (action === "remove") {
      cartService.removeItem(id);
    }

    if (action === "increase" || action === "decrease") {
      const cart = cartService.getCart();
      const item = cart.find((entry) => entry.id === id);
      if (!item) return;
      const delta = action === "increase" ? 1 : -1;
      cartService.updateQuantity(id, item.quantidade + delta);
    }

    uiService.renderCartItems();
    uiService.renderTotals();
    uiService.updateCartCounter();
  });

  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
      if (cartService.getTotalItems() === 0) {
        uiService.showToast("Seu carrinho está vazio.");
        return;
      }

      uiService.showToast("Compra simulada realizada com sucesso!");
      cartService.clearCart();
      couponService.clearCoupon();
      uiService.renderCartItems();
      uiService.renderTotals();
      uiService.updateCartCounter();
    });
  }
};

const initCart = async () => {
  const currentTheme = themeService.getTheme();
  themeService.applyTheme(currentTheme);
  updateThemeToggleIcons(currentTheme);
  bindThemeToggle();
  uiService.updateCartCounter();
  await initProducts();
  await bindProductDetail();
  bindAddToCartButtons();
  uiService.renderCartItems();
  uiService.renderTotals();
  bindCouponActions();
  bindCartActions();
};

document.addEventListener("DOMContentLoaded", initCart);
