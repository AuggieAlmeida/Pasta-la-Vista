# Sprint 2 — Cardápio, Carrinho e Pedidos

> **Duração Estimada:** 1 semana  
> **Dependências:** Sprint 1 Completo ✅  
> **Status:** Planejado (Não iniciado)

---

## Visão Geral

Sprint 2 implementa o core de um serviço de delivery:
- **Menu/Cardápio**: Produtos com categorias, busca e filtros
- **Carrinho**: Gerenciamento local de itens com Zustand
- **Pedidos**: Criação com validação de estoque

---

## Tarefas

### Backend

#### 2.1 Mongoose Schema — Produtos

**Arquivo:** `api/src/modules/products/product.schema.ts`

```typescript
interface IProduct {
  _id: ObjectId
  name: string              // "Pizza Margherita"
  description: string       // Descrição longa
  price: number            // 45.90
  image: string            // URL para Cloudflare R2
  category: string         // "pizzas" | "bebidas" | "sobremesas"
  active: boolean
  preparation_time: number // minutos
  
  customizations?: ICustomization[]  // Tamanho: P/M/G, Ingredientes: +$2.00
  
  createdAt: Date
  updatedAt: Date
}

interface ICustomization {
  _id: ObjectId
  type: string             // "size" | "ingredient"
  name: string
  price_modifier: number   // +0 ou +2.50
  available: boolean
}
```

**Requisitos:**
- [ ] Conexão Mongoose em database.ts já existente
- [ ] Schema com validações (name required, price > 0)
- [ ] Index em `category` para queries rápidas
- [ ] Index em `active` para filtros
- [ ] Exported model `Product`

---

#### 2.2 Menu Service & Redis Cache

**Arquivo:** `api/src/modules/products/product.service.ts`

```typescript
class ProductService {
  async getMenu(): Promise<IProduct[]>
    // SELECT * FROM products WHERE active = true
    // Cache com Redis (TTL 5min): KEY = "menu:all"
  
  async getProductById(id: string): Promise<IProduct>
    // Buscar por ID
    // Cache com Redis (TTL 10min): KEY = "product:{id}"
  
  async getByCategory(category: string): Promise<IProduct[]>
    // WHERE category = ? AND active = true
    // Cache: KEY = "category:{category}" (5min TTL)
  
  async searchByName(query: string): Promise<IProduct[]>
    // LIKE %query%
    // Sem cache (real-time search)
  
  invalidateCache(keys: string[]): Promise<void>
    // Limpar cache ao editar

  async getProductsByIds(ids: string[]): Promise<IProduct[]>
    // Para validação de order items
}
```

**Requisitos:**
- [ ] Usar redis client (já conectado em config/database.ts)
- [ ] TTL patterns: 5min para menu, 10min para produto único
- [ ] Cache invalidation em UPDATE/DELETE
- [ ] Serialização JSON em Redis
- [ ] Tratamento de cache miss (query banco, cachear)

---

#### 2.3 Menu Routes & Controllers

**Arquivo:** `api/src/routes/product.routes.ts`

```
GET  /api/v1/menu                  → getMenu() + cache
GET  /api/v1/menu/search?q=pizza   → searchByName()
GET  /api/v1/menu/category/:cat    → getByCategory()
GET  /api/v1/menu/:id              → getProductById() + cache
```

**Arquivo:** `api/src/modules/products/product.controller.ts`

**Requisitos:**
- [ ] Response format: `{status: "success", data: IProduct[]}`
- [ ] Error handling: 404 se não encontrado
- [ ] Query params validation (limit, offset para pagination)
- [ ] rate-limiting: 100 req/min (leitura pública)

---

#### 2.4 Order Creation Service

**Arquivo:** `api/src/modules/orders/order.schema.ts`

```typescript
interface IOrder {
  _id: ObjectId                    // MongoDB
  id: UUID                         // Prisma
  user_id: UUID                    // FK → users (Prisma)
  items: IOrderItem[]              // [{ product_id, quantity, customizations }]
  subtotal: number                 // Soma itens
  delivery_fee: number             // Taxa fixa ou por zona
  discount: number                 // Cupom
  total: number                    // subtotal + fee - discount
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELED"
  address: {
    street: string
    number: string
    complement?: string
    city: string
    state: string
    zip: string
  }
  notes?: string
  payment_method: "PIX" | "CREDIT_CARD" | "CASH"
  created_at: Date
  updated_at: Date
}

interface IOrderItem {
  _id: ObjectId
  product_id: string       // FK → products (Mongoose)
  quantity: number
  unit_price: number       // Preço no momento do pedido
  customizations: {
    customization_id: string
    price_modifier: number
  }[]
  subtotal: number
}
```

**Arquivo:** `api/src/modules/orders/order.service.ts`

```typescript
class OrderService {
  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order>
    // 1. Validar user_id existe
    // 2. Para cada item:
    //    - Buscar produto
    //    - Validar customizations
    //    - Calcular preço
    // 3. Validar estoque (stock > quantity)
    // 4. Salvar em PostgreSQL (Prisma) + MongoDB
    // 5. Decrementar stock em real-time (Redis?)
    // 6. Retornar order com ID
}
```

**Requisitos:**
- [ ] DTO com Zod schema (items, address, notes, payment_method)
- [ ] Trans ação: Salvar no PostgreSQL + MongoDB simultaneamente
- [ ] Validação: stock check, preços, user autenticado
- [ ] Erro 422 se item inválido ou sem estoque

---

#### 2.5 Order Routes

```
POST /api/v1/orders                     → createOrder (auth required)
GET  /api/v1/orders/:id                → getOrder (auth required)
GET  /api/v1/orders                    → listUserOrders (auth required)
```

**Requisitos:**
- [ ] authMiddleware requerido
- [ ] Validação com validateMiddleware
- [ ] User pode ver apenas seus orders (security check)

---

### Mobile

#### 2.6 Menu Screen

**Arquivo:** `mobile/src/screens/MenuScreen.tsx`

```typescript
interface MenuScreenProps {
  status: "idle" | "loading" | "success" | "error"
  products: IProduct[]
  selectedCategory: string
  searchQuery: string
}
```

**UI Components:**
- [ ] Header com logo
- [ ] Search bar (lupa, input com debounce)
- [ ] Category pills (scrollável: "Todos", "Pizzas", "Bebidas", etc)
- [ ] FlatList de produtos com:
  - [ ] Imagem (cachear com react-native-fast-image)
  - [ ] Nome + descrição
  - [ ] Preço
  - [ ] Botão "Adicionar" com customizações (modal popup)
- [ ] Loading spinner enquanto carrega
- [ ] Error message com retry button

**Funcionalidades:**
- [ ] GET /api/v1/menu ao carregar screen
- [ ] Debounced search: GET /api/v1/menu/search?q={query}
- [ ] Category filter: GET /api/v1/menu/category/{cat}
- [ ] Erro handling com retry

**Arquivo:** `mobile/src/components/MenuProductCard.tsx`

- Card individual com imagem, nome, preço
- Botão "Adicionar" abre customization modal

**Arquivo:** `mobile/src/components/CustomizationModal.tsx`

- Mostra customizations (tamanho, ingredientes)
- Input quantity
- Preview do preço final
- Botão "Adicionar ao Carrinho"

**Requisitos:**
- [ ] Usar React Hook Form para formas se necessário
- [ ] Image optimization (lazy loading, caching)
- [ ] Errors com try-catch
- [ ] Refetch com pull-to-refresh

---

#### 2.7 Cart Store

**Arquivo:** `mobile/src/stores/cart.store.ts`

```typescript
interface CartItem {
  id: string                    // product_id
  name: string
  unit_price: number
  quantity: number
  customizations: {
    id: string
    price_modifier: number
  }[]
  subtotal: number              // (unit_price + sum customizations) * quantity
}

interface CartState {
  items: CartItem[]
  notes: string
  address?: {
    street: string
    number: string
    complement?: string
  }
  
  addItem(item: CartItem): void
  removeItem(id: string): void
  updateQuantity(id: string, qty: number): void
  clear(): void
  setNotes(notes: string): void
  setAddress(address: {...}): void
  
  getTotal(): number            // Calcula subtotal sem taxa
  getItemCount(): number
}
```

**Requisitos:**
- [ ] Persistência em AsyncStorage
- [ ] Validação: quantidade > 0, item válido
- [ ] Cálculo automático de subtotal
- [ ] Não permitir duplicatas (merge se mesmo product)

---

#### 2.8 Cart UI Screen

**Arquivo:** `mobile/src/screens/CartScreen.tsx`

**UI:**
- [ ] FlatList de items com:
  - [ ] Nome, preço unitário, customizações
  - [ ] Input qty com -/+ buttons
  - [ ] Botão remover (ícone X)
- [ ] Total: Subtotal + Taxa de entrega
- [ ] Address form (street, number, complement, city, state, zip)
- [ ] Textarea para notas
- [ ] Método de pagamento: PIX / CREDIT_CARD / CASH (Radio)
- [ ] Botão "Confirmar Pedido"
- [ ] Link "Continuar Comprando" → Menu

**Funcionalidades:**
- [ ] Cartão vazio: "Seu carrinho está vazio" + link para Menu
- [ ] Validação before Checkout:
  - [ ] Cart tem items
  - [ ] Address preenchido
  - [ ] Payment method selecionado
- [ ] Ao clicar "Confirmar":
  - [ ] POST /api/v1/orders com cartStore state
  - [ ] Clear cart
  - [ ] Navigate para OrderConfirmation
  - [ ] Se erro: Alert com retry

---

#### 2.9 Order Confirmation Screen

**Arquivo:** `mobile/src/screens/OrderConfirmationScreen.tsx`

**UI:**
- [ ] Header: "Pedido Confirmado!" com ícone checkmark
- [ ] Order ID e timestamp
- [ ] Items listados (read-only)
- [ ] Total com breakdown (subtotal, taxa)
- [ ] Status: "Aguardando Confirmação do Restaurante"
- [ ] Botão "Rastrear Pedido"
- [ ] Botão "Continuar Comprando" → Menu

**Requisitos:**
- [ ] Recebe order ID como route param
- [ ] Fetcha order details (GET /api/v1/orders/:id)
- [ ] Auto-refresh a cada 10s ou WebSocket

---

#### 2.10 Cart Button in TabNavigator

**Arquivo:** `mobile/src/navigation/ClientNavigator.tsx` (Atualizar)

- [ ] Tab "Carrinho" com badge mostrando quantidade (cartStore.items.length)
- [ ] Badge red background se > 0

---

### Testing

#### 2.11 Product Service Tests

**Arquivo:** `api/tests/product.spec.ts`

```typescript
describe("Product Service", () => {
  it("should get all products from cache", async () => {})
  it("should fetch from DB if cache miss", async () => {})
  it("should get product by ID", async () => {})
  it("should search products by name", async () => {})
  it("should invalidate cache on update", async () => {})
})
```

---

#### 2.12 Order Service Tests

**Arquivo:** `api/tests/order.spec.ts`

```typescript
describe("Order Service", () => {
  it("should create order with valid items", async () => {})
  it("should reject order if stock insufficient", async () => {})
  it("should calculate total correctly", async () => {})
  it("should save to both PostgreSQL and MongoDB", async () => {})
  it("should return 422 if invalid product ID", async () => {})
})
```

---

## Checklist de Conclusão

### Backend
- [ ] Product schema Mongoose criado
- [ ] ProductService com cache Redis
- [ ] Product routes (GET menu, search, category, by-id)
- [ ] Order schema (PostgreSQL + MongoDB)
- [ ] OrderService criado com validações
- [ ] Order routes (POST create, GET list, GET by-id)
- [ ] Tests criados (product + order)
- [ ] Todos testes passando ✅
- [ ] Rotas documentadas no Swagger/Postman (opcional)

### Mobile
- [ ] MenuScreen com produtos e search
- [ ] CustomizationModal para escolher sizes/ingredientes
- [ ] CartStore (Zustand + AsyncStorage)
- [ ] CartScreen com lista de items
- [ ] OrderConfirmationScreen
- [ ] Cart badge in TabNavigator
- [ ] Axios calls para backend testadas
- [ ] Tratamento de erros em todos screens
- [ ] Tipos TypeScript para Products/Orders

### Deployment
- [ ] Seed produtos no banco (MongoDB)
- [ ] Testar end-to-end: Menu → Add → Cart → Checkout → Order
- [ ] Verificar cache Redis funcionando
- [ ] Commit e push para GitHub

---

## Commits Esperados

```
- feat: Sprint 2.1-2.2 Backend menu service com Redis cache
- feat: Sprint 2.3-2.5 Backend order creation e routes
- feat: Sprint 2.6-2.10 Mobile menu screens e cart
- test: Sprint 2.11-2.12 Tests para product e order services
```

---

## Próximo Sprint (Sprint 3)

- Admin dashboard
- Stock management
- Order status updates
- Payment integration com Stripe

---

**Sprint 2 está pronto para começar! 💪**
