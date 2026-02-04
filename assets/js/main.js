const cartKey = "urbanwear-cart";

const getCart = () => {
  const stored = localStorage.getItem(cartKey);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    localStorage.removeItem(cartKey);
    return [];
  }
};

const saveCart = (cart) => {
  localStorage.setItem(cartKey, JSON.stringify(cart));
};

const calculateCartCount = (cart) =>
  cart.reduce((total, item) => total + item.quantidade, 0);

const updateCartCounter = () => {
  const counter = document.querySelector("#cart-count");
  if (!counter) return;
  const cart = getCart();
  counter.textContent = calculateCartCount(cart);
};

const showToast = (message) => {
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
};

const addToCart = (product) => {
  const cart = getCart();
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantidade += 1;
  } else {
    cart.push({ ...product, quantidade: 1 });
  }

  saveCart(cart);
  updateCartCounter();
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
      };

      addToCart(product);
      showToast("Produto adicionado ao carrinho!");
    });
  });
};

const initCart = () => {
  updateCartCounter();
  bindAddToCartButtons();
};

document.addEventListener("DOMContentLoaded", initCart);
