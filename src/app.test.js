import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import app from "./app.js";

test("API expone datos y valida solicitudes", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.equal((await healthResponse.json()).status, "ok");

  const inventoryResponse = await fetch(`${baseUrl}/api/inventory?branch=Guadalajara`);
  const inventory = await inventoryResponse.json();
  assert.equal(inventoryResponse.status, 200);
  assert.ok(inventory.inventory.length > 0);
  assert.ok(inventory.inventory.every((item) => item.branch === "Guadalajara"));

  const dashboardResponse = await fetch(`${baseUrl}/api/dashboard`);
  const { dashboard } = await dashboardResponse.json();
  assert.equal(dashboardResponse.status, 200);
  assert.equal(dashboard.productCount, 10);
  assert.equal(dashboard.criticalProductCount, 1);

  const initialRecommendationsResponse = await fetch(`${baseUrl}/api/recommendations`);
  const initialRecommendations = await initialRecommendationsResponse.json();
  assert.equal(initialRecommendations.recommendations.length, 1);

  const invalidBranch = await fetch(`${baseUrl}/api/inventory?branch=NoExiste`);
  assert.equal(invalidBranch.status, 400);

  const invalidMovement = await fetch(`${baseUrl}/api/movements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "sale",
      sku: "SKU-SA-005",
      branch: "Querétaro",
      quantity: -1,
    }),
  });
  assert.equal(invalidMovement.status, 400);

  const purchase = await fetch(`${baseUrl}/api/movements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "purchase",
      sku: "SKU-SA-005",
      branch: "Querétaro",
      quantity: 20,
    }),
  });
  assert.equal(purchase.status, 201);
  const updatedInventoryResponse = await fetch(
    `${baseUrl}/api/inventory?branch=Quer%C3%A9taro&search=Sanitizante`,
  );
  const updatedInventory = await updatedInventoryResponse.json();
  assert.equal(updatedInventory.inventory[0].quantity, 35);
  assert.equal(updatedInventory.inventory[0].status, "low");

  const recommendationsResponse = await fetch(`${baseUrl}/api/recommendations`);
  const recommendations = await recommendationsResponse.json();
  assert.equal(recommendations.recommendations.length, 0);

  const invalidChat = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "" }),
  });
  assert.equal(invalidChat.status, 400);
});
