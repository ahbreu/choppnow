import assert from "node:assert/strict";
import { resetRuntimeState } from "./lib/state.mjs";
import { startBackendServer } from "./server.mjs";

async function requestJson(baseUrl, routePath, init = {}) {
  const response = await fetch(`${baseUrl}${routePath}`, init);
  const rawBody = await response.text();
  let payload = null;

  if (rawBody.trim().length > 0) {
    payload = JSON.parse(rawBody);
  }

  return {
    response,
    payload,
  };
}

function buildJsonRequest(body, init = {}) {
  return {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(body),
  };
}

async function runSmoke() {
  await resetRuntimeState();
  const backend = await startBackendServer({
    host: "127.0.0.1",
    port: 0,
    quiet: true,
  });

  try {
    const { response: healthResponse, payload: healthPayload } = await requestJson(backend.url, "/health");
    assert.equal(healthResponse.status, 200);
    assert.equal(healthPayload.status, "ok");
    assert.equal(healthPayload.backendMode, "local-validation");

    const { response: buyerLoginResponse, payload: buyerLoginPayload } = await requestJson(
      backend.url,
      "/v1/auth/login",
      buildJsonRequest({
        email: "pedro@choppnow.app",
        password: "pedro123",
      }, { method: "POST" })
    );
    assert.equal(buyerLoginResponse.status, 200);
    assert.equal(typeof buyerLoginPayload.accessToken, "string");

    const buyerAuthorization = `Bearer ${buyerLoginPayload.accessToken}`;
    const { response: authMeResponse, payload: authMePayload } = await requestJson(backend.url, "/v1/auth/me", {
      headers: {
        Accept: "application/json",
        Authorization: buyerAuthorization,
      },
    });
    assert.equal(authMeResponse.status, 200);
    assert.equal(authMePayload.user.email, "pedro@choppnow.app");

    const { response: snapshotResponse, payload: snapshotPayload } = await requestJson(
      backend.url,
      "/v1/catalog/snapshot",
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    assert.equal(snapshotResponse.status, 200);
    assert.equal(Array.isArray(snapshotPayload.stores), true);
    assert.equal(snapshotResponse.headers.get("x-choppnow-discovery-schema-version"), "1");

    const { response: createOrderResponse, payload: createOrderPayload } = await requestJson(
      backend.url,
      "/v1/orders",
      buildJsonRequest(
        {
          storeId: "1",
          items: [{ beerId: "apoena-ipa", quantity: 1 }],
          paymentMethod: "pix",
          deliveryAddress: "SQS 308, Asa Sul - Brasilia, DF",
          deliveryNotes: "Portaria principal",
        },
        {
          method: "POST",
          headers: {
            Authorization: buyerAuthorization,
          },
        }
      )
    );
    assert.equal(createOrderResponse.status, 201);
    assert.equal(createOrderPayload.order.storeId, "1");

    const createdOrderId = createOrderPayload.order.id;

    const { response: buyerOrdersResponse, payload: buyerOrdersPayload } = await requestJson(
      backend.url,
      "/v1/orders/my",
      {
        headers: {
          Accept: "application/json",
          Authorization: buyerAuthorization,
        },
      }
    );
    assert.equal(buyerOrdersResponse.status, 200);
    assert.equal(
      buyerOrdersPayload.items.some((item) => item.id === createdOrderId),
      true
    );

    const { response: sellerLoginResponse, payload: sellerLoginPayload } = await requestJson(
      backend.url,
      "/v1/auth/login",
      buildJsonRequest({
        email: "apoena@choppnow.app",
        password: "apoena123",
      }, { method: "POST" })
    );
    assert.equal(sellerLoginResponse.status, 200);

    const sellerAuthorization = `Bearer ${sellerLoginPayload.accessToken}`;
    const { response: sellerOrdersResponse, payload: sellerOrdersPayload } = await requestJson(
      backend.url,
      "/v1/seller/orders",
      {
        headers: {
          Accept: "application/json",
          Authorization: sellerAuthorization,
        },
      }
    );
    assert.equal(sellerOrdersResponse.status, 200);
    assert.equal(
      sellerOrdersPayload.items.some((item) => item.id === createdOrderId),
      true
    );

    const { response: statusUpdateResponse, payload: statusUpdatePayload } = await requestJson(
      backend.url,
      `/v1/orders/${createdOrderId}/status`,
      buildJsonRequest(
        {
          status: "confirmed",
        },
        {
          method: "PATCH",
          headers: {
            Authorization: sellerAuthorization,
          },
        }
      )
    );
    assert.equal(statusUpdateResponse.status, 200);
    assert.equal(statusUpdatePayload.order.status, "confirmed");

    const { response: createProductResponse, payload: createProductPayload } = await requestJson(
      backend.url,
      "/v1/seller/products",
      buildJsonRequest(
        {
          storeId: "1",
          name: "Apoena Lager de Validacao",
          style: "Lager",
          abv: "4.9%",
          price: "R$ 14,90",
          description: "Rotulo de validacao para smoke do backend.",
          ibu: 18,
          initialUnits: 15,
        },
        {
          method: "POST",
          headers: {
            Authorization: sellerAuthorization,
          },
        }
      )
    );
    assert.equal(createProductResponse.status, 201);
    assert.equal(createProductPayload.product.storeId, "1");

    const createdProductId = createProductPayload.product.id;

    const { response: inventoryResponse, payload: inventoryPayload } = await requestJson(
      backend.url,
      "/v1/catalog/inventory/sync",
      buildJsonRequest(
        {
          syncedAt: new Date().toISOString(),
          updates: [
            {
              beerId: createdProductId,
              availableUnits: 9,
              reason: "seller-stock-adjustment",
            },
          ],
        },
        {
          method: "POST",
          headers: {
            Authorization: sellerAuthorization,
          },
        }
      )
    );
    assert.equal(inventoryResponse.status, 200);
    assert.equal(inventoryPayload.acceptedCount, 1);

    const { response: availabilityResponse, payload: availabilityPayload } = await requestJson(
      backend.url,
      "/v1/seller/store-availability",
      buildJsonRequest(
        {
          storeId: "1",
          status: "paused",
        },
        {
          method: "PATCH",
          headers: {
            Authorization: sellerAuthorization,
          },
        }
      )
    );
    assert.equal(availabilityResponse.status, 200);
    assert.equal(availabilityPayload.status, "paused");

    const { response: finalSnapshotResponse, payload: finalSnapshotPayload } = await requestJson(
      backend.url,
      "/v1/catalog/snapshot",
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    assert.equal(finalSnapshotResponse.status, 200);
    assert.equal(
      finalSnapshotPayload.stores.find((store) => store.id === "1")?.availabilityStatus,
      "paused"
    );
    assert.equal(
      finalSnapshotPayload.beers.find((beer) => beer.id === createdProductId)?.inventory.availableUnits,
      9
    );

    const { response: logoutResponse, payload: logoutPayload } = await requestJson(
      backend.url,
      "/v1/auth/logout",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: sellerAuthorization,
        },
      }
    );
    assert.equal(logoutResponse.status, 200);
    assert.equal(logoutPayload.success, true);

    console.log(`[backend] smoke ok on ${backend.url}`);
  } finally {
    await backend.close();
  }
}

runSmoke().catch((error) => {
  console.error("[backend] smoke failed", error);
  process.exit(1);
});
