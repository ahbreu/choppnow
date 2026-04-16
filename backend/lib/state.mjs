import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const backendRoot = path.resolve(__dirname, "..");
export const repoRoot = path.resolve(backendRoot, "..");
export const runtimeDir = path.join(backendRoot, "runtime");
export const runtimeStatePath = path.join(runtimeDir, "state.json");
export const distDir = path.join(repoRoot, "dist");

const DISCOVERY_SCHEMA_VERSION = 1;
const CHECKOUT_FEES = {
  delivery: 7.9,
  service: 2.5,
};
const ADD_ON_PRICES = {
  "cold-kit": 4.9,
  "glass-cup": 9.9,
  "pairing-snack": 12.9,
};
const ORDER_TRANSITIONS = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready_for_dispatch", "cancelled"],
  ready_for_dispatch: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const DEFAULT_SEED_SYNC_AT = "2026-04-16T12:00:00.000Z";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function parsePriceToNumber(price) {
  const normalized = String(price).replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeNonNegativeInteger(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

function buildAvatarInitials(name) {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "CN";
}

function slugifyName(value) {
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "rotulo";
}

function buildProductId(state, storeId, name) {
  const safeStoreId = slugifyName(storeId);
  const safeName = slugifyName(name);
  const taken = new Set(state.products.map((product) => product.id));
  let candidate = `seller-${safeStoreId}-${safeName}`;
  let suffix = 2;

  while (taken.has(candidate)) {
    candidate = `seller-${safeStoreId}-${safeName}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function buildOrderId() {
  return `order-${Date.now()}`;
}

function buildCheckoutReference(prefix = "REMOTE") {
  return `${prefix}-${Date.now()}`;
}

function createSeedState() {
  const storesSeed = [
    {
      id: "1",
      name: "Apoena Cervejaria",
      tag: "R$ 5 off",
      short: "AC",
      description: "Cervejaria artesanal com foco em receitas autorais e rotulos sazonais.",
      address: "CLS 112, Bloco B, Asa Sul - Brasilia, DF",
      rating: 4.8,
      availabilityStatus: "accepting_orders",
      beers: [
        {
          id: "apoena-pilsen",
          name: "Apoena Pilsen",
          style: "Pilsen",
          abv: "4.8%",
          price: "R$ 13,90",
          rating: 4.6,
          description: "Leve, refrescante e com final seco para consumo diario.",
          ibu: 18,
          inventory: { availableUnits: 120, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
        {
          id: "apoena-ipa",
          name: "Apoena IPA",
          style: "India Pale Ale",
          abv: "6.2%",
          price: "R$ 18,90",
          rating: 4.8,
          description: "Amargor presente, notas citricas e aroma intenso de lupo.",
          ibu: 62,
          inventory: { availableUnits: 120, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
        {
          id: "apoena-weiss",
          name: "Apoena Weiss",
          style: "Wheat Beer",
          abv: "5.2%",
          price: "R$ 16,90",
          rating: 4.7,
          description: "Corpo macio com notas de banana e cravo tipicas do estilo.",
          ibu: 14,
          inventory: { availableUnits: 120, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
        {
          id: "apoena-stout",
          name: "Apoena Stout",
          style: "Dry Stout",
          abv: "5.6%",
          price: "R$ 19,90",
          rating: 4.7,
          description: "Tostada, com cafe e chocolate amargo no retrogosto.",
          ibu: 36,
          inventory: { availableUnits: 120, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
      ],
    },
    {
      id: "2",
      name: "Cruls",
      tag: "Frete gratis",
      short: "CR",
      description: "Taproom moderno com selecao rotativa de chopes e cervejas em lata.",
      address: "CLN 210, Bloco C, Asa Norte - Brasilia, DF",
      rating: 4.7,
      availabilityStatus: "accepting_orders",
      beers: [
        {
          id: "cruls-session-ipa",
          name: "Cruls Session IPA",
          style: "Session IPA",
          abv: "4.5%",
          price: "R$ 15,90",
          rating: 4.5,
          description: "Aromatica, citrica e com baixo teor alcoolico para long session.",
          ibu: 38,
          inventory: { availableUnits: 90, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
        {
          id: "cruls-red-ale",
          name: "Cruls Red Ale",
          style: "Red Ale",
          abv: "5.1%",
          price: "R$ 16,90",
          rating: 4.6,
          description: "Caramelo equilibrado e amargor medio para beber facil.",
          ibu: 28,
          inventory: { availableUnits: 90, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
        {
          id: "cruls-porter",
          name: "Cruls Porter",
          style: "Porter",
          abv: "5.9%",
          price: "R$ 18,50",
          rating: 4.7,
          description: "Escura e aveludada com notas de cacau e torra suave.",
          ibu: 34,
          inventory: { availableUnits: 90, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
        {
          id: "cruls-lager",
          name: "Cruls Lager",
          style: "Lager",
          abv: "4.3%",
          price: "R$ 14,90",
          rating: 4.4,
          description: "Limpa, clara e muito refrescante para qualquer ocasiao.",
          ibu: 16,
          inventory: { availableUnits: 90, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
      ],
    },
    {
      id: "3",
      name: "QuatroPoderes",
      tag: "Ate R$ 10",
      short: "QP",
      description: "Loja especializada em kits de degustacao e harmonizacao com petiscos.",
      address: "SCLS 303, Bloco D, Asa Sul - Brasilia, DF",
      rating: 4.6,
      availabilityStatus: "accepting_orders",
      beers: [
        {
          id: "qp-apa",
          name: "QP APA",
          style: "American Pale Ale",
          abv: "5.3%",
          price: "R$ 17,90",
          rating: 4.6,
          description: "Notas citricas e de maracuja com amargor elegante.",
          ibu: 42,
          inventory: { availableUnits: 80, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
        {
          id: "qp-belgian",
          name: "QP Belgian",
          style: "Belgian Blond",
          abv: "6.4%",
          price: "R$ 20,90",
          rating: 4.7,
          description: "Frutada, levemente condimentada e com final seco.",
          ibu: 22,
          inventory: { availableUnits: 80, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
        {
          id: "qp-sour",
          name: "QP Sour",
          style: "Catharina Sour",
          abv: "4.2%",
          price: "R$ 19,50",
          rating: 4.5,
          description: "Acida na medida com fruta tropical e alta drinkability.",
          ibu: 10,
          inventory: { availableUnits: 80, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
        {
          id: "qp-brown-ale",
          name: "QP Brown Ale",
          style: "Brown Ale",
          abv: "5.8%",
          price: "R$ 18,90",
          rating: 4.6,
          description: "Toffee e castanhas em corpo medio e final suave.",
          ibu: 26,
          inventory: { availableUnits: 80, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
      ],
    },
    {
      id: "4",
      name: "Galpao 17",
      tag: "Combo do dia",
      short: "G17",
      description: "Emporio com foco em rotulos locais, nacionais e importados.",
      address: "SIA Trecho 17, Lote 4 - Brasilia, DF",
      rating: 4.9,
      availabilityStatus: "accepting_orders",
      beers: [
        {
          id: "g17-pils",
          name: "Galpao Pils",
          style: "Pilsner",
          abv: "4.7%",
          price: "R$ 14,90",
          rating: 4.7,
          description: "Amargor limpo e herbal com final seco e crocante.",
          ibu: 24,
          inventory: { availableUnits: 110, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
        {
          id: "g17-hazy-ipa",
          name: "Galpao Hazy IPA",
          style: "Hazy IPA",
          abv: "6.0%",
          price: "R$ 22,90",
          rating: 4.9,
          description: "Macia, turva e super aromatica com perfil tropical.",
          ibu: 46,
          inventory: { availableUnits: 110, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
        {
          id: "g17-dubbel",
          name: "Galpao Dubbel",
          style: "Belgian Dubbel",
          abv: "6.8%",
          price: "R$ 23,50",
          rating: 4.8,
          description: "Maltada com notas de frutas escuras e especiarias.",
          ibu: 20,
          inventory: { availableUnits: 110, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
        {
          id: "g17-sour",
          name: "Galpao Sour",
          style: "Fruit Sour",
          abv: "4.4%",
          price: "R$ 20,90",
          rating: 4.6,
          description: "Acidez refrescante com fruta vermelha e final limpo.",
          ibu: 12,
          inventory: { availableUnits: 110, isAvailable: true, lastSyncedAt: DEFAULT_SEED_SYNC_AT },
        },
      ],
    },
  ];

  const products = storesSeed.flatMap((store) =>
    store.beers.map((beer) => ({
      ...beer,
      storeId: store.id,
    }))
  );

  return {
    version: 1,
    generatedAt: DEFAULT_SEED_SYNC_AT,
    users: [
      {
        id: "user-pedro",
        email: "pedro@choppnow.app",
        password: "pedro123",
        name: "Pedro",
        role: "buyer",
        phone: "(61) 99999-1000",
        address: "SQS 308, Asa Sul - Brasilia, DF",
        notificationsEnabled: true,
      },
      {
        id: "user-apoena",
        email: "apoena@choppnow.app",
        password: "apoena123",
        name: "Apoena Cervejaria",
        role: "seller",
        phone: "(61) 98888-2000",
        address: "CLS 112, Bloco B, Asa Sul - Brasilia, DF",
        notificationsEnabled: true,
        sellerStoreId: "1",
      },
    ],
    sessions: [],
    stores: storesSeed.map(({ beers: _beers, ...store }) => store),
    products,
    discovery: {
      version: DISCOVERY_SCHEMA_VERSION,
      highlights: [
        {
          id: "hl-g17-hazy",
          title: "Hazy da semana",
          subtitle: "Galpao Hazy IPA com nota 4.9",
          badge: "Destaque",
          targetType: "beer",
          targetId: "g17-hazy-ipa",
        },
        {
          id: "hl-apoena-store",
          title: "Taproom em alta",
          subtitle: "Apoena com kits para hoje",
          badge: "Local",
          targetType: "store",
          targetId: "1",
        },
        {
          id: "hl-sour-collection",
          title: "Especial Sour",
          subtitle: "Catalogo com acidas e frutadas",
          badge: "Colecao",
          targetType: "catalog",
          catalogMode: "beers",
        },
      ],
      campaigns: [
        {
          id: "cp-frete",
          kicker: "Campanha",
          title: "Rotulos com frete zero",
          description: "Selecao com entrega sem custo para acelerar a primeira compra.",
          ctaLabel: "Ver cervejarias",
          targetType: "catalog",
          catalogMode: "stores",
        },
        {
          id: "cp-lupulo",
          kicker: "Curadoria",
          title: "Rota lupulada",
          description: "IPAs e APAs com perfil aromatico para quem busca amargor.",
          ctaLabel: "Abrir catalogo",
          targetType: "catalog",
          catalogMode: "beers",
        },
        {
          id: "cp-search",
          kicker: "Explorar",
          title: "Monte seu filtro",
          description: "Abra a busca para combinar estilo, faixa de IBU e cervejaria.",
          ctaLabel: "Ir para busca",
          targetType: "search",
        },
      ],
      storySteps: [
        { id: "story-01", title: "Descubra", description: "Comece pelos destaques e campanhas do dia." },
        { id: "story-02", title: "Compare", description: "Use colecoes e filtros para reduzir as opcoes." },
        { id: "story-03", title: "Escolha", description: "Entre no detalhe da loja ou da cerveja para decidir." },
      ],
      filters: [
        {
          id: "stores-top-rated",
          mode: "stores",
          label: "Mais bem avaliadas",
          description: "Lojas com nota igual ou maior que 4.8.",
          criteria: { minRating: 4.8 },
        },
        {
          id: "stores-promos",
          mode: "stores",
          label: "Promocoes",
          description: "Cervejarias com tag de desconto, frete ou combo.",
          criteria: { tagIncludes: ["off", "gratis", "combo"] },
        },
        {
          id: "stores-asa-sul",
          mode: "stores",
          label: "Asa Sul",
          description: "Lojas com entrega mais rapida na Asa Sul.",
          criteria: { addressIncludes: ["Asa Sul"] },
        },
        {
          id: "beers-light",
          mode: "beers",
          label: "Leves",
          description: "IBU ate 20 para consumo facil.",
          criteria: { maxIbu: 20 },
        },
        {
          id: "beers-hoppy",
          mode: "beers",
          label: "Lupuladas",
          description: "IBU acima de 40 para amargor marcante.",
          criteria: { minIbu: 40 },
        },
        {
          id: "beers-under-18",
          mode: "beers",
          label: "Ate R$ 18",
          description: "Rotulos com ticket de entrada mais acessivel.",
          criteria: { maxPrice: 18 },
        },
        {
          id: "beers-top-rated",
          mode: "beers",
          label: "Notas 4.7+",
          description: "Cervejas com melhor avaliacao no app.",
          criteria: { minRating: 4.7 },
        },
      ],
    },
    orders: [
      {
        id: "order-1001",
        buyerId: "user-pedro",
        storeId: "1",
        items: [
          { beerId: "apoena-ipa", quantity: 2 },
          { beerId: "apoena-pilsen", quantity: 1 },
        ],
        totals: {
          currency: "BRL",
          subtotal: 41.3,
          deliveryFee: 7.9,
          serviceFee: 2.5,
          total: 51.7,
        },
        createdAt: "2026-04-15T19:10:00.000Z",
        status: "preparing",
        slaMinutes: 35,
        checkoutReference: "REMOTE-SEED-1001",
        buyerNotificationsEnabled: true,
      },
      {
        id: "order-1002",
        buyerId: "user-pedro",
        storeId: "2",
        items: [{ beerId: "cruls-red-ale", quantity: 2 }],
        totals: {
          currency: "BRL",
          subtotal: 33.8,
          deliveryFee: 0,
          serviceFee: 0,
          total: 33.8,
        },
        createdAt: "2026-04-15T17:45:00.000Z",
        status: "out_for_delivery",
        slaMinutes: 25,
        checkoutReference: "REMOTE-SEED-1002",
        buyerNotificationsEnabled: true,
      },
      {
        id: "order-0998",
        buyerId: "user-pedro",
        storeId: "1",
        items: [{ beerId: "apoena-stout", quantity: 1 }],
        totals: {
          currency: "BRL",
          subtotal: 19.9,
          deliveryFee: 0,
          serviceFee: 0,
          total: 19.9,
        },
        createdAt: "2026-04-14T20:05:00.000Z",
        status: "delivered",
        slaMinutes: 30,
        checkoutReference: "REMOTE-SEED-0998",
        buyerNotificationsEnabled: true,
      },
    ],
  };
}

export function getBackendConfig() {
  const host = process.env.CHOPPNOW_BACKEND_HOST?.trim() || "127.0.0.1";
  const port = Number(process.env.CHOPPNOW_BACKEND_PORT || 4010);
  return {
    host,
    port: Number.isFinite(port) ? port : 4010,
    serveDist: String(process.env.CHOPPNOW_BACKEND_SERVE_DIST || "").toLowerCase() === "true",
  };
}

export async function ensureRuntimeState() {
  await mkdir(runtimeDir, { recursive: true });

  try {
    await readFile(runtimeStatePath, "utf8");
  } catch {
    await resetRuntimeState();
  }
}

export async function loadState() {
  await ensureRuntimeState();
  const raw = await readFile(runtimeStatePath, "utf8");
  return JSON.parse(raw);
}

export async function saveState(state) {
  await mkdir(runtimeDir, { recursive: true });
  await writeFile(runtimeStatePath, JSON.stringify(state, null, 2), "utf8");
}

export async function resetRuntimeState() {
  const state = createSeedState();
  await saveState(state);
  return state;
}

export function toBackendSessionUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    address: user.address,
    notificationsEnabled: user.notificationsEnabled,
    ...(user.sellerStoreId ? { sellerStoreId: user.sellerStoreId } : {}),
  };
}

export function findUserByEmail(state, email) {
  const normalized = String(email).trim().toLowerCase();
  return state.users.find((user) => user.email.toLowerCase() === normalized) ?? null;
}

export function findUserById(state, userId) {
  return state.users.find((user) => user.id === userId) ?? null;
}

export function findStoreById(state, storeId) {
  return state.stores.find((store) => store.id === storeId) ?? null;
}

export function findProductById(state, productId) {
  return state.products.find((product) => product.id === productId) ?? null;
}

export function findOrderById(state, orderId) {
  return state.orders.find((order) => order.id === orderId) ?? null;
}

export function createSession(state, userId) {
  const accessToken = `cn-at-${crypto.randomUUID()}`;
  const refreshToken = `cn-rt-${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const nextSession = {
    accessToken,
    refreshToken,
    userId,
    expiresAt,
  };

  state.sessions = state.sessions.filter((session) => session.userId !== userId);
  state.sessions.push(nextSession);
  return nextSession;
}

export function findSessionByAccessToken(state, accessToken) {
  const now = Date.now();

  state.sessions = state.sessions.filter((session) => Date.parse(session.expiresAt) > now);
  return state.sessions.find((session) => session.accessToken === accessToken) ?? null;
}

export function invalidateSession(state, accessToken) {
  const originalLength = state.sessions.length;
  state.sessions = state.sessions.filter((session) => session.accessToken !== accessToken);
  return state.sessions.length !== originalLength;
}

export function buildCatalogSnapshot(state) {
  return {
    version: state.version,
    fetchedAt: nowIso(),
    stores: state.stores.map((store) => ({
      id: store.id,
      name: store.name,
      tag: store.tag,
      short: store.short,
      description: store.description,
      address: store.address,
      rating: store.rating,
      availabilityStatus: store.availabilityStatus,
    })),
    beers: state.products.map((product) => ({
      id: product.id,
      storeId: product.storeId,
      name: product.name,
      style: product.style,
      abv: product.abv,
      price: product.price,
      rating: product.rating,
      description: product.description,
      ibu: product.ibu,
      inventory: clone(product.inventory),
    })),
    discovery: clone(state.discovery),
  };
}

export function createProduct(state, payload) {
  const timestamp = nowIso();
  const initialUnits = normalizeNonNegativeInteger(payload.initialUnits);
  const product = {
    id: buildProductId(state, payload.storeId, payload.name),
    storeId: payload.storeId,
    name: String(payload.name).trim(),
    style: String(payload.style).trim(),
    abv: String(payload.abv).trim(),
    price: String(payload.price).trim(),
    rating: 4.5,
    description: String(payload.description).trim(),
    ibu: normalizeNonNegativeInteger(payload.ibu),
    inventory: {
      availableUnits: initialUnits,
      isAvailable: initialUnits > 0,
      lastSyncedAt: timestamp,
    },
  };

  state.products.push(product);
  return clone(product);
}

export function updateProduct(state, productId, patch) {
  const product = findProductById(state, productId);
  if (!product) return null;

  if (typeof patch.name === "string") product.name = patch.name.trim();
  if (typeof patch.style === "string") product.style = patch.style.trim();
  if (typeof patch.abv === "string") product.abv = patch.abv.trim();
  if (typeof patch.price === "string") product.price = patch.price.trim();
  if (typeof patch.description === "string") product.description = patch.description.trim();
  if (typeof patch.ibu === "number") product.ibu = normalizeNonNegativeInteger(patch.ibu);

  return clone(product);
}

export function applyInventoryUpdates(state, updates) {
  const syncedAt = nowIso();
  let acceptedCount = 0;
  let rejectedCount = 0;

  updates.forEach((update) => {
    const product = findProductById(state, update.beerId);
    if (!product) {
      rejectedCount += 1;
      return;
    }

    const nextUnits = normalizeNonNegativeInteger(update.availableUnits);
    product.inventory = {
      availableUnits: nextUnits,
      isAvailable: nextUnits > 0,
      lastSyncedAt: syncedAt,
    };
    acceptedCount += 1;
  });

  return {
    acceptedCount,
    rejectedCount,
    syncedAt,
  };
}

export function buildOrderTotals(state, items) {
  const subtotal = items.reduce((sum, item) => {
    const product = findProductById(state, item.beerId);
    if (!product) {
      throw new Error(`Produto nao encontrado: ${item.beerId}`);
    }

    const addOnsTotal = (item.addOns ?? []).reduce((addOnSum, addOn) => {
      const unitPrice = ADD_ON_PRICES[addOn.id] ?? 0;
      return addOnSum + unitPrice * normalizeNonNegativeInteger(addOn.quantity);
    }, 0);

    return sum + (parsePriceToNumber(product.price) + addOnsTotal) * normalizeNonNegativeInteger(item.quantity);
  }, 0);

  return {
    currency: "BRL",
    subtotal: Number(subtotal.toFixed(2)),
    deliveryFee: CHECKOUT_FEES.delivery,
    serviceFee: CHECKOUT_FEES.service,
    total: Number((subtotal + CHECKOUT_FEES.delivery + CHECKOUT_FEES.service).toFixed(2)),
  };
}

export function createOrder(state, buyerUser, payload) {
  const totals = buildOrderTotals(state, payload.items);
  const order = {
    id: buildOrderId(),
    buyerId: buyerUser.id,
    storeId: payload.storeId,
    items: payload.items.map((item) => ({
      beerId: item.beerId,
      quantity: normalizeNonNegativeInteger(item.quantity),
      ...(Array.isArray(item.addOns) && item.addOns.length > 0
        ? {
            addOns: item.addOns.map((addOn) => ({
              id: addOn.id,
              quantity: normalizeNonNegativeInteger(addOn.quantity),
            })),
          }
        : {}),
    })),
    totals,
    createdAt: nowIso(),
    status: "placed",
    slaMinutes: payload.paymentMethod === "pix" ? 35 : 40,
    checkoutReference: buildCheckoutReference("REMOTE"),
    buyerNotificationsEnabled: buyerUser.notificationsEnabled,
  };

  state.orders.unshift(order);
  return clone(order);
}

export function listBuyerOrders(state, buyerId) {
  return state.orders.filter((order) => order.buyerId === buyerId).map((order) => clone(order));
}

export function listSellerOrders(state, storeId) {
  return state.orders.filter((order) => order.storeId === storeId).map((order) => clone(order));
}

export function updateOrderStatus(state, orderId, nextStatus) {
  const order = findOrderById(state, orderId);
  if (!order) return null;

  if (!ORDER_TRANSITIONS[order.status].includes(nextStatus)) {
    throw new Error(`Transicao invalida: ${order.status} -> ${nextStatus}`);
  }

  order.status = nextStatus;
  return clone(order);
}

export function updateStoreAvailability(state, storeId, status) {
  const store = findStoreById(state, storeId);
  if (!store) return null;

  store.availabilityStatus = status;
  return {
    storeId,
    status,
    updatedAt: nowIso(),
  };
}

export function getPublicHealth(state) {
  return {
    status: "ok",
    users: state.users.length,
    stores: state.stores.length,
    products: state.products.length,
    orders: state.orders.length,
    sessions: state.sessions.length,
  };
}

export function getDistFilePath(requestPath) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const candidate = path.normalize(path.join(distDir, normalizedPath));

  if (!candidate.startsWith(distDir)) {
    return null;
  }

  return candidate;
}

export function getStaticContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".js") return "application/javascript; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".json") return "application/json; charset=utf-8";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".ico") return "image/x-icon";
  if (extension === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

export function getDefaultHeaders() {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  };
}

export function getDiscoveryHeader() {
  return String(DISCOVERY_SCHEMA_VERSION);
}

export function isAllowedOrderStatus(value) {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(ORDER_TRANSITIONS, value);
}

export function isAllowedAvailabilityStatus(value) {
  return value === "accepting_orders" || value === "paused";
}

export function withUserProfile(user) {
  return {
    ...toBackendSessionUser(user),
    avatarInitials: buildAvatarInitials(user.name),
  };
}
