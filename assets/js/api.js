const apiService = {
  async getProducts() {
    return Promise.resolve([
      {
        id: "1",
        nome: "Camisa Essential",
        preco: 129.9,
        imagem:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
        descricao:
          "Camisa masculina com corte reto e tecido leve, perfeita para compor visuais urbanos.",
        colecao: "Coleção Essentials",
      },
      {
        id: "2",
        nome: "Calça Jeans Street",
        preco: 219.9,
        imagem:
          "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
        descricao:
          "Jeans com lavagem moderna, caimento confortável e acabamento premium.",
        colecao: "Coleção Street",
      },
      {
        id: "3",
        nome: "Jaqueta Downtown",
        preco: 389.9,
        imagem:
          "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80",
        descricao:
          "Jaqueta urbana resistente, ideal para noites frias e composições cheias de atitude.",
        colecao: "Coleção Urbanwear",
      },
      {
        id: "4",
        nome: "Tênis Urban Motion",
        preco: 349.9,
        imagem:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
        descricao:
          "Tênis casual com solado macio e design minimalista para o dia a dia.",
        colecao: "Coleção Motion",
      },
      {
        id: "5",
        nome: "Moletom Skyline",
        preco: 239.9,
        imagem:
          "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
        descricao:
          "Moletom aconchegante com toque macio e visual moderno para temperaturas baixas.",
        colecao: "Coleção Skyline",
      },
      {
        id: "6",
        nome: "Camisa Urban Fit",
        preco: 149.9,
        imagem:
          "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
        descricao:
          "Camisa versátil com modelagem slim e acabamento premium.",
        colecao: "Coleção Essentials",
      },
    ]);
  },
};
