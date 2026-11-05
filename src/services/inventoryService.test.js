import assert from "node:assert/strict";
import test from "node:test";
import {
  getDashboard,
  getInventory,
  getRecommendations,
  getStockStatus,
  recordMovement,
} from "./inventoryService.js";

test("clasifica correctamente los límites de stock", () => {
  assert.equal(getStockStatus(29), "critical");
  assert.equal(getStockStatus(30), "low");
  assert.equal(getStockStatus(100), "low");
  assert.equal(getStockStatus(101), "normal");
});

test("la semilla conserva el ejemplo y recomienda solo existencias críticas", () => {
  const inventory = getInventory();
  const cloro = inventory.find(
    (item) => item.sku === "SKU-CL-001" && item.branch === "Guadalajara",
  );
  const desengrasante = inventory.find(
    (item) => item.sku === "SKU-DG-004" && item.branch === "León",
  );
  const sanitizer = inventory.find(
    (item) => item.sku === "SKU-SA-005" && item.branch === "Querétaro",
  );

  assert.equal(inventory.length, 50);
  assert.equal(cloro.quantity, 240);
  assert.equal(cloro.status, "normal");
  assert.equal(desengrasante.quantity, 45);
  assert.equal(desengrasante.status, "low");
  assert.equal(sanitizer.quantity, 15);
  assert.equal(sanitizer.status, "critical");
  assert.deepEqual(
    getRecommendations().map(({ sku, branch, recommendedQuantity }) => ({
      sku,
      branch,
      recommendedQuantity,
    })),
    [{ sku: "SKU-SA-005", branch: "Querétaro", recommendedQuantity: 85 }],
  );
});

test("dashboard agrega valores y distingue productos por SKU", () => {
  const dashboard = getDashboard();

  assert.equal(dashboard.productCount, 10);
  assert.equal(dashboard.criticalProductCount, 1);
  assert.ok(dashboard.totalUnits > 0);
  assert.ok(dashboard.estimatedValue > 0);
  assert.equal(dashboard.stockByBranch.length, 5);
  assert.equal(dashboard.topSellingProducts[0].product, "Cloro Industrial");
});

test("compra, venta y transferencia actualizan existencias; rechaza exceso", async (t) => {
  const location = (branch) =>
    getInventory().find(
      (item) => item.sku === "SKU-SA-005" && item.branch === branch,
    ).quantity;
  const before = location("Querétaro");

  await t.test("registra una compra recibida", () => {
    const movement = recordMovement({
      type: "purchase",
      sku: "SKU-SA-005",
      branch: "Querétaro",
      quantity: 20,
    });
    assert.equal(movement.type, "purchase");
    assert.equal(location("Querétaro"), before + 20);
  });

  await t.test("registra una venta sin dejar stock negativo", () => {
    recordMovement({
      type: "sale",
      sku: "SKU-SA-005",
      branch: "Querétaro",
      quantity: 5,
    });
    assert.equal(location("Querétaro"), before + 15);
  });

  await t.test("transfiere existencias entre sucursales", () => {
    const destinationBefore = location("Guadalajara");
    recordMovement({
      type: "transfer",
      sku: "SKU-SA-005",
      sourceBranch: "Querétaro",
      destinationBranch: "Guadalajara",
      quantity: 10,
    });
    assert.equal(location("Querétaro"), before + 5);
    assert.equal(location("Guadalajara"), destinationBefore + 10);
  });

  await t.test("rechaza cantidades superiores a la existencia sin mutar", () => {
    const sourceBefore = location("Querétaro");
    assert.throws(
      () =>
        recordMovement({
          type: "sale",
          sku: "SKU-SA-005",
          branch: "Querétaro",
          quantity: sourceBefore + 1,
        }),
      /no alcanza/i,
    );
    assert.equal(location("Querétaro"), sourceBefore);
  });
});
