const cartKey = "urbanwear-cart";
const couponKey = "urbanwear-coupon";
const themeKey = "urbanwear-theme";
const ordersKey = "orders";
const shippingCost = 20;

const debounce = (callback, delay = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), delay);
  };
};

const emitEvent = (event, detail) => {
  window.dispatchEvent(new CustomEvent(event, { detail }));
};

const store = (() => {
  const listeners = new Map();
  const state = {
    cart: [],
    coupon: "",
    theme: "dark",
  };

  const sanitizeCart = (cart) => (Array.isArray(cart) ? cart : []);

  const setState = (partial) => {
    Object.assign(state, partial);
  };

  const emit = (event, detail) => {
    emitEvent(event, detail);
    const callbacks = listeners.get(event) || [];
    callbacks.forEach((cb) => cb(detail));
  };

  const init = () => {
    try {
      const storedCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
      state.cart = sanitizeCart(storedCart);
    } catch (error) {
      state.cart = [];
      localStorage.removeItem(cartKey);
    }

    state.coupon = localStorage.getItem(couponKey) || "";
    state.theme = localStorage.getItem(themeKey) || "dark";
  };

  init();

  return {
    getState() {
      return { ...state };
    },
    subscribe(event, callback) {
      const existing = listeners.get(event) || [];
      listeners.set(event, [...existing, callback]);
    },
    updateCart(cart) {
      const normalized = sanitizeCart(cart);
      setState({ cart: normalized });
      localStorage.setItem(cartKey, JSON.stringify(normalized));
      emit("cart:updated", normalized);
    },
    updateCoupon(code) {
      setState({ coupon: code });
      if (code) {
        localStorage.setItem(couponKey, code);
      } else {
        localStorage.removeItem(couponKey);
      }
      emit("coupon:updated", code);
    },
    updateTheme(theme) {
      setState({ theme });
      localStorage.setItem(themeKey, theme);
      emit("theme:changed", theme);
    },
  };
})();

const cartService = {
  getCart() {
    return store.getState().cart;
  },
  saveCart(cart) {
    store.updateCart(cart);
  },
  addItem(product) {
    const cart = this.getCart();
    const existingItem = cart.find((item) => String(item.id) === String(product.id));

    if (existingItem) {
      existingItem.quantidade += 1;
    } else {
      cart.push({ ...product, quantidade: 1 });
    }

    this.saveCart([...cart]);
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
    this.saveCart([...cart]);
  },
  clearCart() {
    this.saveCart([]);
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
};

const couponService = {
  getCoupon() {
    return store.getState().coupon;
  },
  saveCoupon(code) {
    store.updateCoupon(code);
  },
  clearCoupon() {
    store.updateCoupon("");
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
    return store.getState().theme;
  },
  toggleTheme() {
    const next = this.getTheme() === "dark" ? "light" : "dark";
    store.updateTheme(next);
    return next;
  },
  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  },
};

const orderService = {
  getOrders() {
    try {
      const stored = JSON.parse(localStorage.getItem(ordersKey) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      localStorage.removeItem(ordersKey);
      return [];
    }
  },
  saveOrders(orders) {
    localStorage.setItem(ordersKey, JSON.stringify(orders));
  },
  createOrder(cart, totals, paymentMethod) {
    const order = {
      id: `ORDER${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "created",
      items: cart.map((item) => ({
        id: item.id,
        nome: item.nome,
        preco: item.preco,
        quantidade: item.quantidade,
        imagem: item.imagem,
      })),
      subtotal: totals.subtotal,
      desconto: totals.desconto,
      frete: totals.frete,
      total: totals.total,
      payment: {
        method: paymentMethod,
        status: "pending",
        transactionId: "",
      },
    };

    const orders = this.getOrders();
    this.saveOrders([order, ...orders]);
    emitEvent("order:created", order);
    return order;
  },
  getOrderById(orderId) {
    return this.getOrders().find((order) => order.id === orderId);
  },
  updateOrder(orderId, updater) {
    const orders = this.getOrders();
    const index = orders.findIndex((order) => order.id === orderId);
    if (index === -1) return null;
    const updated = updater({ ...orders[index] });
    orders[index] = updated;
    this.saveOrders(orders);
    emitEvent("order:updated", updated);
    return updated;
  },
  updateOrderStatus(orderId, status) {
    return this.updateOrder(orderId, (order) => ({ ...order, status }));
  },
  updatePayment(orderId, payment) {
    return this.updateOrder(orderId, (order) => ({
      ...order,
      payment: { ...order.payment, ...payment },
    }));
  },
};

const checkoutService = {
  getTotals() {
    const subtotal = cartService.getSubtotal();
    const desconto = couponService.getDiscount(subtotal);
    const frete = couponService.getShippingCost();
    const total = subtotal > 0 ? subtotal - desconto + frete : 0;
    return { subtotal, desconto, frete, total };
  },
  async processCheckout(paymentMethod) {
    const cart = cartService.getCart();
    if (!cart.length) return null;

    const totals = this.getTotals();
    const order = orderService.createOrder(cart, totals, paymentMethod);

    const payment = await paymentApi.processPayment({
      method: paymentMethod,
      amount: totals.total,
    });

    emitEvent("payment:processed", payment);

    let nextStatus = "created";
    if (payment.status === "approved") {
      nextStatus = "paid";
      cartService.clearCart();
      couponService.clearCoupon();
    } else if (payment.status === "pending") {
      nextStatus = "pending";
    }

    orderService.updateOrder(order.id, (current) => ({
      ...current,
      status: nextStatus,
      payment: {
        method: payment.method,
        status: payment.status,
        transactionId: payment.transactionId,
      },
    }));

    return order;
  },
  confirmPixPayment(orderId) {
    orderService.updateOrder(orderId, (order) => ({
      ...order,
      status: "paid",
      payment: {
        ...order.payment,
        status: "approved",
        transactionId: order.payment.transactionId || `TXN${Date.now()}`,
      },
    }));
  },
};

const uiService = {
  formatCurrency(value) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  },
  formatDate(value) {
    return new Date(value).toLocaleString("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  },
  statusLabel(status) {
    const labels = {
      created: "Criado",
      paid: "Pago",
      pending: "Pendente",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  },
  paymentLabel(status) {
    const labels = {
      approved: "Aprovado",
      pending: "Pendente",
      rejected: "Recusado",
    };
    return labels[status] || status;
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
          <img src="${item.imagem}" alt="${item.nome}" loading="lazy" />
        </div>
        <div class="cart-item-info">
          <h3>${item.nome}</h3>
          <p class="muted">${this.formatCurrency(item.preco)} cada</p>
          <div class="cart-quantity" role="group" aria-label="Quantidade de ${item.nome}">
            <button class="qty-btn" data-action="decrease" data-id="${item.id}" ${decreaseDisabled} aria-label="Diminuir quantidade">-</button>
            <span aria-live="polite">${item.quantidade}</span>
            <button class="qty-btn" data-action="increase" data-id="${item.id}" aria-label="Aumentar quantidade">+</button>
          </div>
        </div>
        <div class="cart-item-actions">
          <p class="subtotal">${this.formatCurrency(
            item.preco * item.quantidade
          )}</p>
          <button class="btn outline" data-action="remove" data-id="${
            item.id
          }" aria-label="Remover ${item.nome}">Remover item</button>
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

    const totals = checkoutService.getTotals();
    const hasItems = totals.total > 0;

    subtotalEl.textContent = this.formatCurrency(totals.subtotal);
    shippingEl.textContent = this.formatCurrency(totals.frete);
    if (discountEl) {
      discountEl.textContent = this.formatCurrency(totals.desconto);
    }
    totalEl.textContent = this.formatCurrency(totals.total);

    if (checkoutButton) {
      checkoutButton.disabled = !hasItems;
    }
  },
  renderOrdersList() {
    const list = document.querySelector("[data-orders-list]");
    const emptyState = document.querySelector("[data-orders-empty]");

    if (!list || !emptyState) return;

    const orders = orderService.getOrders();
    list.innerHTML = "";

    if (!orders.length) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    orders.forEach((order) => {
      const li = document.createElement("li");
      li.className = "order-card";
      li.innerHTML = `
        <div>
          <h3>${order.id}</h3>
          <p class="muted">${this.formatDate(order.createdAt)}</p>
        </div>
        <span class="status-badge status-${order.status}">${this.statusLabel(order.status)}</span>
        <strong>${this.formatCurrency(order.total)}</strong>
        <a class="btn outline" href="pedido-detalhe.html?orderId=${order.id}">Detalhes</a>
      `;
      list.appendChild(li);
    });
  },
  renderOrderConfirmation() {
    const container = document.querySelector("[data-order-summary]");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");
    const order = orderId ? orderService.getOrderById(orderId) : null;

    if (!order) {
      container.innerHTML = `<p class="muted">Pedido não encontrado.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="confirmation-row">
        <span>Número do pedido</span>
        <strong>${order.id}</strong>
      </div>
      <div class="confirmation-row">
        <span>Status do pedido</span>
        <strong class="status-badge status-${order.status}">${this.statusLabel(order.status)}</strong>
      </div>
      <div class="confirmation-row">
        <span>Pagamento</span>
        <strong>${this.paymentLabel(order.payment.status)}</strong>
      </div>
      <div class="confirmation-row">
        <span>Método</span>
        <strong>${order.payment.method}</strong>
      </div>
      <div class="confirmation-row">
        <span>Total</span>
        <strong>${this.formatCurrency(order.total)}</strong>
      </div>
    `;
  },
  renderOrderDetail() {
    const container = document.querySelector("[data-order-detail-card]");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");
    const order = orderId ? orderService.getOrderById(orderId) : null;

    if (!order) {
      container.innerHTML = `<p class="muted">Pedido não encontrado.</p>`;
      return;
    }

    const items = order.items
      .map(
        (item) => `
        <li>
          <span>${item.nome} (${item.quantidade}x)</span>
          <strong>${this.formatCurrency(item.preco * item.quantidade)}</strong>
        </li>
      `
      )
      .join("");

    const pixAction =
      order.payment.method === "pix" && order.payment.status === "pending"
        ? `<button class="btn primary" data-confirm-pix>Confirmar pagamento Pix</button>`
        : "";

    container.innerHTML = `
      <div class="order-meta">
        <div>
          <h2>${order.id}</h2>
          <p class="muted">${this.formatDate(order.createdAt)}</p>
        </div>
        <span class="status-badge status-${order.status}">${this.statusLabel(order.status)}</span>
      </div>
      <div class="order-sections">
        <div>
          <h3>Itens</h3>
          <ul class="order-items">${items}</ul>
        </div>
        <div class="order-summary">
          <h3>Resumo</h3>
          <p>Subtotal: <strong>${this.formatCurrency(order.subtotal)}</strong></p>
          <p>Desconto: <strong>${this.formatCurrency(order.desconto)}</strong></p>
          <p>Frete: <strong>${this.formatCurrency(order.frete)}</strong></p>
          <p>Total: <strong>${this.formatCurrency(order.total)}</strong></p>
        </div>
      </div>
      <div class="order-payment">
        <h3>Pagamento</h3>
        <p>Método: <strong>${order.payment.method}</strong></p>
        <p>Status: <strong>${this.paymentLabel(order.payment.status)}</strong></p>
        <p>Transação: <strong>${order.payment.transactionId || "-"}</strong></p>
        ${pixAction}
      </div>
    `;
  },
  showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });
    setTimeout(() => toast.classList.remove("show"), 2200);
  },
  setLoading(container, isLoading) {
    if (!container) return;
    container.dataset.loading = isLoading ? "true" : "false";
    container.setAttribute("aria-busy", isLoading ? "true" : "false");
    if (isLoading) {
      container.dataset.error = "";
    }
  },
  setError(container, message) {
    if (!container) return;
    container.dataset.error = message || "";
    container.setAttribute("aria-busy", "false");
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

  const updateFeedback = debounce((message) => {
    if (feedback) feedback.textContent = message;
  }, 200);

  button.addEventListener("click", () => {
    const code = input.value.trim().toUpperCase();

    if (!code) {
      couponService.clearCoupon();
      updateFeedback("Cupom removido.");
      return;
    }

    if (!couponService.isValid(code)) {
      updateFeedback("Cupom inválido.");
      return;
    }

    couponService.saveCoupon(code);
    updateFeedback(`Cupom aplicado: ${code}.`);
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

  uiService.setLoading(addButton, true);

  try {
    const products = await apiService.getProducts();
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id") || products[0].id;
    const product = products.find((item) => item.id === productId) || products[0];

    imageEl.src = product.imagem;
    imageEl.alt = product.nome;
    imageEl.loading = "lazy";
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
  } catch (error) {
    descEl.textContent = "Não foi possível carregar o produto agora.";
  } finally {
    uiService.setLoading(addButton, false);
  }
};

const renderProductCards = (products, container, options = {}) => {
  if (!container) return;

  const { limit } = options;
  const slice = limit ? products.slice(0, limit) : products;
  container.innerHTML = slice
    .map(
      (product) => `
      <article class="product-card">
        <img src="${product.imagem}" alt="${product.nome}" loading="lazy" />
        <div class="product-info">
          <h3>${product.nome}</h3>
          <p class="price">${uiService.formatCurrency(product.preco)}</p>
          <a class="btn outline" href="produto.html?id=${product.id}" aria-label="Ver detalhes de ${product.nome}">Ver Produto</a>
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

  const target = featuredContainer || listContainer;
  uiService.setLoading(target, true);

  try {
    const products = await apiService.getProducts();
    if (featuredContainer) {
      renderProductCards(products, featuredContainer, { limit: 3 });
    }
    if (listContainer) {
      renderProductCards(products, listContainer);
    }
  } catch (error) {
    if (featuredContainer) uiService.setError(featuredContainer, "Erro ao carregar produtos.");
    if (listContainer) uiService.setError(listContainer, "Erro ao carregar produtos.");
  } finally {
    uiService.setLoading(target, false);
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
      const item = cart.find((entry) => String(entry.id) === String(id));
      if (!item) return;
      const delta = action === "increase" ? 1 : -1;
      cartService.updateQuantity(id, item.quantidade + delta);
    }
  });

  if (checkoutButton) {
    checkoutButton.addEventListener("click", async () => {
      if (cartService.getTotalItems() === 0) {
        uiService.showToast("Seu carrinho está vazio.");
        return;
      }

      const selected = document.querySelector("input[name=\"payment-method\"]:checked");
      if (!selected) {
        uiService.showToast("Selecione um método de pagamento.");
        return;
      }

      checkoutButton.disabled = true;
      uiService.showToast("Processando pagamento...");
      const order = await checkoutService.processCheckout(selected.value);
      checkoutButton.disabled = false;

      if (order) {
        window.location.href = `pedido-confirmado.html?orderId=${order.id}`;
      }
    });
  }
};

const bindOrderActions = () => {
  const container = document.querySelector("[data-order-detail-card]");
  if (!container) return;

  container.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches("[data-confirm-pix]")) {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get("orderId");
      if (orderId) {
        checkoutService.confirmPixPayment(orderId);
        uiService.showToast("Pagamento Pix confirmado.");
      }
    }
  });
};

const bindStoreEvents = () => {
  store.subscribe("cart:updated", () => {
    uiService.renderCartItems();
    uiService.renderTotals();
    uiService.updateCartCounter();
  });

  store.subscribe("coupon:updated", () => {
    uiService.renderTotals();
  });

  store.subscribe("theme:changed", (theme) => {
    themeService.applyTheme(theme);
    updateThemeToggleIcons(theme);
  });

  window.addEventListener("order:created", () => {
    uiService.renderOrdersList();
  });

  window.addEventListener("order:updated", () => {
    uiService.renderOrdersList();
    uiService.renderOrderDetail();
    uiService.renderOrderConfirmation();
  });
};

const initCart = async () => {
  const currentTheme = themeService.getTheme();
  themeService.applyTheme(currentTheme);
  updateThemeToggleIcons(currentTheme);
  bindThemeToggle();
  bindStoreEvents();
  uiService.updateCartCounter();
  await initProducts();
  await bindProductDetail();
  bindAddToCartButtons();
  uiService.renderCartItems();
  uiService.renderTotals();
  uiService.renderOrdersList();
  uiService.renderOrderDetail();
  uiService.renderOrderConfirmation();
  bindCouponActions();
  bindCartActions();
  bindOrderActions();
};

document.addEventListener("DOMContentLoaded", initCart);
