const cartKey = "urbanwear-cart";
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
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantidade += 1;
    } else {
      cart.push({ ...product, quantidade: 1 });
    }

    this.saveCart(cart);
  },
  removeItem(productId) {
    const cart = this.getCart().filter((item) => item.id !== productId);
    this.saveCart(cart);
  },
  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const item = cart.find((entry) => entry.id === productId);

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
    const totalEl = document.querySelector("[data-cart-total]");
    const checkoutButton = document.querySelector("[data-checkout]");

    if (!subtotalEl || !shippingEl || !totalEl) return;

    const hasItems = cartService.getTotalItems() > 0;
    subtotalEl.textContent = this.formatCurrency(cartService.getSubtotal());
    shippingEl.textContent = this.formatCurrency(shippingCost);
    totalEl.textContent = this.formatCurrency(cartService.getTotalWithShipping());

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
      uiService.renderCartItems();
      uiService.renderTotals();
      uiService.updateCartCounter();
    });
  }
};

const initCart = () => {
  uiService.updateCartCounter();
  bindAddToCartButtons();
  uiService.renderCartItems();
  uiService.renderTotals();
  bindCartActions();
};

document.addEventListener("DOMContentLoaded", initCart);
