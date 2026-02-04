# UrbanWear - Portfólio E-commerce de Vestuário

Projeto fictício de e-commerce de vestuário criado exclusivamente para fins de portfólio. O objetivo é demonstrar habilidades em HTML, CSS e JavaScript puro com foco em layout moderno, responsividade e experiência de navegação.

## Tecnologias utilizadas
- HTML5
- CSS3
- JavaScript puro

## Observação
Este e-commerce é totalmente fictício e não realiza vendas reais.

## Funcionalidades do carrinho
- Carrinho persistente com `localStorage`, mantendo itens e quantidades entre páginas.
- Página dedicada com controle de quantidade, remoção de itens e cálculo de subtotal/frete.
- Simulação de checkout com feedback visual e limpeza do carrinho.
- Correção do bug de múltiplos produtos garantindo que o carrinho seja sempre um array.

## Fluxo de pedidos e pagamento
- Criação de pedido com status `created`, processamento de pagamento mock e atualização para `paid` ou `pending`.
- Histórico de pedidos com detalhamento completo e navegação baseada em URL (`pedido-detalhe.html?orderId=...`).
- Simulação de confirmação de pagamento Pix via botão no detalhe do pedido.

## Modelo de dados (pedido)
```\n{\n  id: \"ORDER123456\",\n  createdAt: \"2026-02-04T14:30:00\",\n  status: \"created | paid | pending | cancelled\",\n  items: [\n    { id: 1, nome: \"Camisa Urbana\", preco: 129.90, quantidade: 2 }\n  ],\n  subtotal: 259.80,\n  desconto: 25.98,\n  frete: 20.00,\n  total: 253.82,\n  payment: {\n    method: \"pix | credit_card | debit_card\",\n    status: \"approved | pending | rejected\",\n    transactionId: \"TXN123456\"\n  }\n}\n```

## Arquitetura front-end
- Separação entre regras de negócio (`cartService`, `orderService`), cupons (`couponService`), tema (`themeService`) e interface (`uiService`).
- Componentes reutilizáveis via `data-attributes` para manter o JavaScript enxuto.
- Mock API via `apiService` para centralizar a lista de produtos.
- Store global com eventos (`cart:updated`, `coupon:updated`, `theme:changed`) para UI reativa.
 - Eventos customizados de pedidos e pagamentos: `order:created`, `order:updated`, `payment:processed`.

## Nota técnica
O estado do carrinho fica armazenado no `localStorage` do navegador, sem uso de back-end.
Pedidos e pagamentos também são simulados e persistidos localmente.

## Mock API e cupom
- Produtos carregados via `apiService` com Promise/async.
- Cupons disponíveis: `URBAN10` (10% de desconto) e `FRETEGRATIS` (frete zero).

## Dark mode
- Alternância global com persistência no `localStorage`.

## Decisões técnicas
- Store centralizado evita inconsistências entre páginas e simplifica o controle de estado.
- Eventos customizados garantem atualização da UI sem dependências externas.
- Mock API simula latência para aproximar o comportamento de uma aplicação real.

## Testes manuais recomendados
- Adicionar produtos diferentes e validar itens e quantidades no carrinho.
- Aplicar cupons `URBAN10` e `FRETEGRATIS` e validar cálculo de desconto/frete.
- Alternar o tema e recarregar a página para garantir persistência.
- Finalizar compra e validar criação do pedido, status do pagamento e histórico.

## GitHub Pages
Acesse o projeto publicado em: https://seu-usuario.github.io/portfolio-ecommerce-vestuario
