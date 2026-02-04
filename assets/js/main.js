const cartKey = "urbanwear-cart-count";

const getCartCount = () => {
  const stored = localStorage.getItem(cartKey);
  return stored ? Number(stored) : 0;
};

const setCartCount = (count) => {
  localStorage.setItem(cartKey, String(count));
  const counter = document.querySelector("#cart-count");
  if (counter) {
    counter.textContent = count;
  }
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

const bindAddToCart = () => {
  const addButton = document.querySelector("[data-add-to-cart]");
  if (!addButton) return;

  addButton.addEventListener("click", () => {
    const newCount = getCartCount() + 1;
    setCartCount(newCount);
    showToast("Produto adicionado ao carrinho!");
  });
};

const initCart = () => {
  setCartCount(getCartCount());
  bindAddToCart();
};

document.addEventListener("DOMContentLoaded", initCart);
