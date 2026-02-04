const paymentApi = {
  async processPayment({ method, amount }) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const random = Math.random();
        const status = random < 0.6 ? "approved" : random < 0.85 ? "pending" : "rejected";
        resolve({
          status,
          method,
          transactionId: `TXN${Date.now()}`,
          amount,
        });
      }, 600);
    });
  },
};
