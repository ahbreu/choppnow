import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyInventoryUpdates,
  buildCatalogSnapshot,
  createOrder,
  createProduct,
  createSession,
  ensureRuntimeState,
  findOrderById,
  findSessionByAccessToken,
  findStoreById,
  findUserByEmail,
  findUserById,
  getBackendConfig,
  getDefaultHeaders,
  getDiscoveryHeader,
  getDistFilePath,
  getPublicHealth,
  getStaticContentType,
  invalidateSession,
  isAllowedAvailabilityStatus,
  isAllowedOrderStatus,
  listBuyerOrders,
  listSellerOrders,
  loadState,
  saveState,
  toBackendSessionUser,
  updateOrderStatus,
  updateProduct,
  updateStoreAvailability,
} from "./lib/state.mjs";

const __filename = fileURLToPath(import.meta.url);

const DEFAULT_ALLOWED_HEADERS = [
  "Authorization",
  "Content-Type",
  "Accept",
  "x-choppnow-user-id",
  "x-choppnow-user-role",
  "x-choppnow-user-email",
  "x-choppnow-store-id",
  "x-choppnow-discovery-schema-version",
].join(", ");
const JSON_BODY_LIMIT_BYTES = 1024 * 1024;
const PRODUCT_ROUTE_PATTERN = /^\/v1\/seller\/products\/([^/]+)$/;
const ORDER_STATUS_ROUTE_PATTERN = /^\/v1\/orders\/([^/]+)\/status$/;

class HttpError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeNonNegativeInteger(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

function buildCorsHeaders(request) {
  const requestedHeaders = request.headers["access-control-request-headers"];
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS,HEAD",
    "access-control-allow-headers":
      typeof requestedHeaders === "string" && requestedHeaders.trim().length > 0
        ? requestedHeaders
        : DEFAULT_ALLOWED_HEADERS,
    "access-control-max-age": "600",
  };
}

function buildHeaders(request, overrides = {}) {
  return {
    ...getDefaultHeaders(),
    ...buildCorsHeaders(request),
    ...overrides,
  };
}

function writeJson(request, response, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, buildHeaders(request, headers));
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  response.end(body);
}

function writeText(request, response, status, body, headers = {}) {
  response.writeHead(
    status,
    buildHeaders(request, {
      "content-type": "text/plain; charset=utf-8",
      ...headers,
    })
  );
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  response.end(body);
}

function writeError(request, response, error) {
  if (error instanceof HttpError) {
    writeJson(request, response, error.status, {
      message: error.message,
      ...error.details,
    });
    return;
  }

  console.error("[backend] unhandled error", error);
  writeJson(request, response, 500, {
    message: "Backend local falhou ao processar a requisicao.",
  });
}

function getHeaderValue(request, name) {
  const rawValue = request.headers[name.toLowerCase()];
  if (Array.isArray(rawValue)) return rawValue[0] ?? null;
  return typeof rawValue === "string" ? rawValue : null;
}

async function readJsonBody(request) {
  const chunks = [];
  let totalLength = 0;

  for await (const chunk of request) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalLength += bufferChunk.length;
    if (totalLength > JSON_BODY_LIMIT_BYTES) {
      throw new HttpError(413, "Payload excedeu o limite suportado.");
    }
    chunks.push(bufferChunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (!rawBody) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawBody);
    if (!isPlainObject(parsed)) {
      throw new HttpError(400, "O payload JSON precisa ser um objeto.");
    }
    return parsed;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(400, "JSON invalido no corpo da requisicao.");
  }
}

function extractBearerToken(request) {
  const authorization = getHeaderValue(request, "authorization");
  if (!authorization) return null;
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

async function resolveRequestAuth(state, request, options = {}) {
  const { allowCompatibility = true } = options;
  const bearerToken = extractBearerToken(request);

  if (bearerToken) {
    const sessionsBefore = state.sessions.length;
    const session = findSessionByAccessToken(state, bearerToken);
    if (state.sessions.length !== sessionsBefore) {
      await saveState(state);
    }
    if (session) {
      const user = findUserById(state, session.userId);
      if (user) {
        return {
          user,
          session,
          source: "bearer",
        };
      }
    }
  }

  if (!allowCompatibility) {
    return null;
  }

  const requestedUserId = getHeaderValue(request, "x-choppnow-user-id");
  const requestedEmail = getHeaderValue(request, "x-choppnow-user-email");
  const requestedRole = getHeaderValue(request, "x-choppnow-user-role");
  const requestedStoreId = getHeaderValue(request, "x-choppnow-store-id");

  let user = null;
  if (requestedUserId) {
    user = findUserById(state, requestedUserId);
  } else if (requestedEmail) {
    user = findUserByEmail(state, requestedEmail);
  }

  if (!user) {
    return null;
  }

  if (requestedRole && user.role !== requestedRole) {
    return null;
  }

  if (requestedStoreId && user.sellerStoreId && user.sellerStoreId !== requestedStoreId) {
    return null;
  }

  return {
    user,
    session: null,
    source: "compatibility",
  };
}

async function requireAuthenticatedUser(state, request, options = {}) {
  const { roles = null, allowCompatibility = true } = options;
  const auth = await resolveRequestAuth(state, request, { allowCompatibility });

  if (!auth) {
    throw new HttpError(401, "Sessao invalida ou ausente.");
  }

  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(auth.user.role)) {
    throw new HttpError(403, "Usuario nao autorizado para esta operacao.");
  }

  return auth.user;
}

function ensureString(value, fieldName, options = {}) {
  const { allowEmpty = false } = options;
  if (typeof value !== "string") {
    throw new HttpError(400, `Campo obrigatorio invalido: ${fieldName}.`);
  }

  const normalized = value.trim();
  if (!allowEmpty && normalized.length === 0) {
    throw new HttpError(400, `Campo obrigatorio invalido: ${fieldName}.`);
  }

  return normalized;
}

function ensureOrderPayload(state, payload) {
  const storeId = ensureString(payload.storeId, "storeId");
  const paymentMethod = ensureString(payload.paymentMethod, "paymentMethod");
  const deliveryAddress = ensureString(payload.deliveryAddress, "deliveryAddress");
  const deliveryNotes = typeof payload.deliveryNotes === "string" ? payload.deliveryNotes.trim() : "";
  const couponCode = typeof payload.couponCode === "string" ? payload.couponCode.trim() : undefined;

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new HttpError(400, "O pedido precisa ter ao menos um item.");
  }

  const store = findStoreById(state, storeId);
  if (!store) {
    throw new HttpError(404, "Loja nao encontrada.");
  }
  if (store.availabilityStatus === "paused") {
    throw new HttpError(409, "A loja esta pausada no momento.");
  }

  const items = payload.items.map((item, index) => {
    if (!isPlainObject(item)) {
      throw new HttpError(400, `Item ${index + 1} do pedido esta invalido.`);
    }

    const beerId = ensureString(item.beerId, `items[${index}].beerId`);
    const quantity = normalizeNonNegativeInteger(item.quantity);
    if (quantity <= 0) {
      throw new HttpError(400, `Quantidade invalida para ${beerId}.`);
    }

    const product = state.products.find((candidate) => candidate.id === beerId);
    if (!product) {
      throw new HttpError(404, `Produto nao encontrado: ${beerId}.`);
    }
    if (product.storeId !== storeId) {
      throw new HttpError(409, `Produto ${beerId} nao pertence a loja ${storeId}.`);
    }
    if (!product.inventory.isAvailable || product.inventory.availableUnits < quantity) {
      throw new HttpError(409, `Estoque insuficiente para ${product.name}.`);
    }

    let addOns;
    if (Array.isArray(item.addOns) && item.addOns.length > 0) {
      addOns = item.addOns.map((addOn, addOnIndex) => {
        if (!isPlainObject(addOn)) {
          throw new HttpError(
            400,
            `Add-on ${addOnIndex + 1} do item ${beerId} esta invalido.`
          );
        }

        return {
          id: ensureString(addOn.id, `items[${index}].addOns[${addOnIndex}].id`),
          quantity: normalizeNonNegativeInteger(addOn.quantity),
        };
      });
    }

    return {
      beerId,
      quantity,
      ...(addOns ? { addOns } : {}),
    };
  });

  return {
    storeId,
    items,
    paymentMethod,
    deliveryAddress,
    deliveryNotes,
    ...(couponCode ? { couponCode } : {}),
  };
}

function ensureSellerProductPayload(state, user, payload) {
  const storeId = ensureString(payload.storeId, "storeId");
  if (user.sellerStoreId !== storeId) {
    throw new HttpError(403, "O seller so pode publicar produtos da propria loja.");
  }
  if (!findStoreById(state, storeId)) {
    throw new HttpError(404, "Loja nao encontrada para publicar o produto.");
  }

  return {
    storeId,
    name: ensureString(payload.name, "name"),
    style: ensureString(payload.style, "style"),
    abv: ensureString(payload.abv, "abv"),
    price: ensureString(payload.price, "price"),
    description: ensureString(payload.description, "description"),
    ibu: normalizeNonNegativeInteger(payload.ibu),
    initialUnits: normalizeNonNegativeInteger(payload.initialUnits),
  };
}

function ensureProductPatchPayload(payload) {
  if (!isPlainObject(payload)) {
    throw new HttpError(400, "Payload invalido para atualizacao de produto.");
  }

  const patch = {};

  if (typeof payload.name === "string") patch.name = payload.name.trim();
  if (typeof payload.style === "string") patch.style = payload.style.trim();
  if (typeof payload.abv === "string") patch.abv = payload.abv.trim();
  if (typeof payload.price === "string") patch.price = payload.price.trim();
  if (typeof payload.description === "string") patch.description = payload.description.trim();
  if (typeof payload.ibu === "number") patch.ibu = normalizeNonNegativeInteger(payload.ibu);

  return patch;
}

function ensureInventorySyncPayload(state, user, payload) {
  if (!Array.isArray(payload.updates)) {
    throw new HttpError(400, "Payload invalido para sincronizacao de estoque.");
  }

  return payload.updates.map((update, index) => {
    if (!isPlainObject(update)) {
      throw new HttpError(400, `Atualizacao ${index + 1} de estoque esta invalida.`);
    }

    const beerId = ensureString(update.beerId, `updates[${index}].beerId`);
    const availableUnits = normalizeNonNegativeInteger(update.availableUnits);
    const reason = ensureString(update.reason, `updates[${index}].reason`);
    const product = state.products.find((candidate) => candidate.id === beerId);

    if (!product) {
      throw new HttpError(404, `Produto nao encontrado para sync: ${beerId}.`);
    }

    if (user.role === "seller" && product.storeId !== user.sellerStoreId) {
      throw new HttpError(403, `O seller nao pode ajustar o estoque de ${beerId}.`);
    }

    if (user.role === "buyer" && reason !== "checkout-order-placed") {
      throw new HttpError(403, "Compradores so podem sincronizar estoque de pedidos criados no checkout.");
    }

    return {
      beerId,
      availableUnits,
      reason,
      ...(typeof update.eventId === "string" ? { eventId: update.eventId } : {}),
      ...(typeof update.queuedAt === "string" ? { queuedAt: update.queuedAt } : {}),
    };
  });
}

function ensureOrderStatusPayload(payload) {
  const status = ensureString(payload.status, "status");
  if (!isAllowedOrderStatus(status)) {
    throw new HttpError(400, "Status de pedido invalido.");
  }
  return status;
}

function ensureStoreAvailabilityPayload(user, payload) {
  const status = ensureString(payload.status, "status");
  if (!isAllowedAvailabilityStatus(status)) {
    throw new HttpError(400, "Status de disponibilidade invalido.");
  }

  const storeId =
    typeof payload.storeId === "string" && payload.storeId.trim().length > 0
      ? payload.storeId.trim()
      : user.sellerStoreId;

  if (!storeId) {
    throw new HttpError(400, "storeId obrigatorio para alterar a disponibilidade.");
  }

  if (user.sellerStoreId !== storeId) {
    throw new HttpError(403, "O seller so pode alterar a disponibilidade da propria loja.");
  }

  return {
    storeId,
    status,
  };
}

function buildOrderListResponse(items) {
  return {
    items,
    total: items.length,
  };
}

async function maybeServeStaticAsset(request, response, requestPath, config) {
  if (!config.serveDist) return false;
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (requestPath === "/health" || requestPath.startsWith("/v1/")) return false;

  const candidatePath = getDistFilePath(requestPath);
  if (!candidatePath) {
    writeText(request, response, 404, "Arquivo solicitado fora do dist.");
    return true;
  }

  let filePath = candidatePath;
  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      throw new Error("not-a-file");
    }
  } catch {
    if (path.extname(requestPath)) {
      writeText(request, response, 404, "Arquivo estatico nao encontrado.");
      return true;
    }

    filePath = getDistFilePath("/");
    if (!filePath) {
      writeText(request, response, 503, "Dist web indisponivel.");
      return true;
    }

    try {
      const fileStats = await stat(filePath);
      if (!fileStats.isFile()) {
        throw new Error("missing-index");
      }
    } catch {
      writeText(
        request,
        response,
        503,
        "Build web nao encontrada. Rode npm run export:web antes de servir o preview."
      );
      return true;
    }
  }

  const asset = await readFile(filePath);
  response.writeHead(
    200,
    buildHeaders(request, {
      "content-type": getStaticContentType(filePath),
      "cache-control": "no-store",
    })
  );
  if (request.method === "HEAD") {
    response.end();
    return true;
  }
  response.end(asset);
  return true;
}

async function handleRequest(request, response, config) {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const requestPath = requestUrl.pathname;

  if (request.method === "OPTIONS") {
    response.writeHead(204, buildHeaders(request));
    response.end();
    return;
  }

  if (await maybeServeStaticAsset(request, response, requestPath, config)) {
    return;
  }

  if (request.method === "GET" && requestPath === "/health") {
    const state = await loadState();
    writeJson(request, response, 200, {
      ...getPublicHealth(state),
      backendMode: "local-validation",
      serveDist: config.serveDist,
    });
    return;
  }

  if (request.method === "POST" && requestPath === "/v1/auth/login") {
    const state = await loadState();
    const payload = await readJsonBody(request);
    const email = ensureString(payload.email, "email").toLowerCase();
    const password = ensureString(payload.password, "password");
    const user = findUserByEmail(state, email);

    if (!user || user.password !== password) {
      throw new HttpError(401, "Credenciais invalidas.");
    }

    const session = createSession(state, user.id);
    await saveState(state);
    writeJson(request, response, 200, {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      user: toBackendSessionUser(user),
    });
    return;
  }

  if (request.method === "POST" && requestPath === "/v1/auth/logout") {
    const state = await loadState();
    const bearerToken = extractBearerToken(request);

    if (bearerToken) {
      invalidateSession(state, bearerToken);
      await saveState(state);
    }

    writeJson(request, response, 200, { success: true });
    return;
  }

  if (request.method === "GET" && requestPath === "/v1/auth/me") {
    const state = await loadState();
    const user = await requireAuthenticatedUser(state, request, {
      roles: ["buyer", "seller"],
      allowCompatibility: false,
    });
    writeJson(request, response, 200, { user: toBackendSessionUser(user) });
    return;
  }

  if (request.method === "GET" && requestPath === "/v1/catalog/snapshot") {
    const state = await loadState();
    writeJson(request, response, 200, buildCatalogSnapshot(state), {
      "x-choppnow-discovery-schema-version": getDiscoveryHeader(),
    });
    return;
  }

  if (request.method === "POST" && requestPath === "/v1/seller/products") {
    const state = await loadState();
    const user = await requireAuthenticatedUser(state, request, { roles: ["seller"] });
    const payload = ensureSellerProductPayload(state, user, await readJsonBody(request));
    const product = createProduct(state, payload);
    await saveState(state);
    writeJson(request, response, 201, { product });
    return;
  }

  if (request.method === "PATCH" && PRODUCT_ROUTE_PATTERN.test(requestPath)) {
    const state = await loadState();
    const user = await requireAuthenticatedUser(state, request, { roles: ["seller"] });
    const productId = decodeURIComponent(requestPath.match(PRODUCT_ROUTE_PATTERN)[1]);
    const product = state.products.find((candidate) => candidate.id === productId);

    if (!product) {
      throw new HttpError(404, "Produto nao encontrado.");
    }
    if (product.storeId !== user.sellerStoreId) {
      throw new HttpError(403, "O seller so pode editar produtos da propria loja.");
    }

    const updatedProduct = updateProduct(state, productId, ensureProductPatchPayload(await readJsonBody(request)));
    await saveState(state);
    writeJson(request, response, 200, { product: updatedProduct });
    return;
  }

  if (request.method === "POST" && requestPath === "/v1/catalog/inventory/sync") {
    const state = await loadState();
    const user = await requireAuthenticatedUser(state, request, { roles: ["buyer", "seller"] });
    const updates = ensureInventorySyncPayload(state, user, await readJsonBody(request));
    const result = applyInventoryUpdates(state, updates);
    await saveState(state);
    writeJson(request, response, 200, result);
    return;
  }

  if (request.method === "POST" && requestPath === "/v1/orders") {
    const state = await loadState();
    const user = await requireAuthenticatedUser(state, request, { roles: ["buyer"] });
    const order = createOrder(state, user, ensureOrderPayload(state, await readJsonBody(request)));
    await saveState(state);
    writeJson(request, response, 201, { order });
    return;
  }

  if (request.method === "GET" && requestPath === "/v1/orders/my") {
    const state = await loadState();
    const user = await requireAuthenticatedUser(state, request, { roles: ["buyer"] });
    writeJson(request, response, 200, buildOrderListResponse(listBuyerOrders(state, user.id)));
    return;
  }

  if (request.method === "GET" && requestPath === "/v1/seller/orders") {
    const state = await loadState();
    const user = await requireAuthenticatedUser(state, request, { roles: ["seller"] });
    if (!user.sellerStoreId) {
      throw new HttpError(400, "Seller sem storeId associado.");
    }
    writeJson(
      request,
      response,
      200,
      buildOrderListResponse(listSellerOrders(state, user.sellerStoreId))
    );
    return;
  }

  if (request.method === "PATCH" && ORDER_STATUS_ROUTE_PATTERN.test(requestPath)) {
    const state = await loadState();
    const user = await requireAuthenticatedUser(state, request, { roles: ["seller"] });
    if (!user.sellerStoreId) {
      throw new HttpError(400, "Seller sem storeId associado.");
    }

    const orderId = decodeURIComponent(requestPath.match(ORDER_STATUS_ROUTE_PATTERN)[1]);
    const order = findOrderById(state, orderId);
    if (!order) {
      throw new HttpError(404, "Pedido nao encontrado.");
    }
    if (order.storeId !== user.sellerStoreId) {
      throw new HttpError(403, "O seller so pode alterar pedidos da propria loja.");
    }

    const status = ensureOrderStatusPayload(await readJsonBody(request));
    const updatedOrder = updateOrderStatus(state, orderId, status);
    await saveState(state);
    writeJson(request, response, 200, {
      order: updatedOrder,
      changedAt: new Date().toISOString(),
    });
    return;
  }

  if (request.method === "PATCH" && requestPath === "/v1/seller/store-availability") {
    const state = await loadState();
    const user = await requireAuthenticatedUser(state, request, { roles: ["seller"] });
    const payload = ensureStoreAvailabilityPayload(user, await readJsonBody(request));
    const result = updateStoreAvailability(state, payload.storeId, payload.status);
    if (!result) {
      throw new HttpError(404, "Loja nao encontrada para atualizar disponibilidade.");
    }
    await saveState(state);
    writeJson(request, response, 200, result);
    return;
  }

  writeJson(request, response, 404, {
    message: "Rota nao encontrada no backend local do ChoppNow.",
  });
}

export function createBackendServer(options = {}) {
  const baseConfig = getBackendConfig();
  const config = {
    host: typeof options.host === "string" ? options.host : baseConfig.host,
    port:
      typeof options.port === "number" && Number.isFinite(options.port)
        ? options.port
        : baseConfig.port,
    serveDist:
      typeof options.serveDist === "boolean" ? options.serveDist : baseConfig.serveDist,
    quiet: options.quiet === true,
  };

  const server = createServer((request, response) => {
    handleRequest(request, response, config).catch((error) => writeError(request, response, error));
  });

  return {
    server,
    config,
  };
}

export async function startBackendServer(options = {}) {
  await ensureRuntimeState();

  const { server, config } = createBackendServer(options);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, resolve);
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : config.port;
  const url = `http://${config.host}:${port}`;

  if (!config.quiet) {
    console.log(`[backend] listening on ${url}`);
    if (config.serveDist) {
      console.log("[backend] static dist preview enabled");
    }
  }

  return {
    server,
    config: {
      ...config,
      port,
    },
    url,
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

async function runCli() {
  const backend = await startBackendServer();

  const shutdown = async () => {
    await backend.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (path.resolve(process.argv[1] ?? "") === __filename) {
  runCli().catch((error) => {
    console.error("[backend] failed to start", error);
    process.exit(1);
  });
}
