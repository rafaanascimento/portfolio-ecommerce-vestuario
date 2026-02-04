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

## Arquitetura front-end
- Separação entre regras de negócio (`cartService`), cupons (`couponService`), tema (`themeService`) e interface (`uiService`).
- Componentes reutilizáveis via `data-attributes` para manter o JavaScript enxuto.
- Mock API via `apiService` para centralizar a lista de produtos.

## Nota técnica
O estado do carrinho fica armazenado no `localStorage` do navegador, sem uso de back-end.

## Mock API e cupom
- Produtos carregados via `apiService` com Promise/async.
- Cupons disponíveis: `URBAN10` (10% de desconto) e `FRETEGRATIS` (frete zero).

## Dark mode
- Alternância global com persistência no `localStorage`.

## GitHub Pages
Acesse o projeto publicado em: https://seu-usuario.github.io/portfolio-ecommerce-vestuario
