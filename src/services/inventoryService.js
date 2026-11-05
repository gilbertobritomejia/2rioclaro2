import { randomUUID } from "node:crypto";
import { branches, products } from "../data/inventory.js";

const LOW_STOCK_LIMIT = 100;
const CRITICAL_STOCK_LIMIT = 30;
const REPLENISHMENT_TARGET = 100;
const MAX_MOVEMENT_QUANTITY = 100_000;

const inventory = products.flatMap((product) =>
  branches.map((branch, index) => ({
    sku: product.sku,
    product: product.name,
    category: product.category,
    unit: product.unit,
    estimatedUnitCost: product.estimatedUnitCost,
    branch,
    quantity: product.stock[index],
  })),
);

const movements = [];

export class InventoryError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "InventoryError";
    this.statusCode = statusCode;
  }
}

export function getStockStatus(quantity) {
  if (quantity < CRITICAL_STOCK_LIMIT) return "critical";
  if (quantity <= LOW_STOCK_LIMIT) return "low";
  return "normal";
}

export function getInventory({ branch, search } = {}) {
  const normalizedSearch = search?.trim().toLocaleLowerCase("es-MX");

  return inventory
    .filter((item) => !branch || item.branch === branch)
    .filter(
      (item) =>
        !normalizedSearch ||
        item.product.toLocaleLowerCase("es-MX").includes(normalizedSearch) ||
        item.sku.toLocaleLowerCase("es-MX").includes(normalizedSearch),
    )
    .map(({ estimatedUnitCost, ...item }) => ({
      ...item,
      status: getStockStatus(item.quantity),
    }));
}

export function getRecommendations() {
  return inventory
    .filter((item) => item.quantity < CRITICAL_STOCK_LIMIT)
    .map((item) => ({
      sku: item.sku,
      product: item.product,
      branch: item.branch,
      currentQuantity: item.quantity,
      recommendedQuantity: REPLENISHMENT_TARGET - item.quantity,
      targetQuantity: REPLENISHMENT_TARGET,
      unit: item.unit,
      priority: "critical",
    }))
    .sort((a, b) => a.currentQuantity - b.currentQuantity);
}

export function getDashboard() {
  const totalsByBranch = branches.map((branch) => ({
    branch,
    quantity: inventory
      .filter((item) => item.branch === branch)
      .reduce((total, item) => total + item.quantity, 0),
  }));
  const criticalProducts = new Set(
    inventory
      .filter((item) => item.quantity < CRITICAL_STOCK_LIMIT)
      .map((item) => item.sku),
  );
  const lowProducts = new Set(
    inventory
      .filter(
        (item) =>
          item.quantity >= CRITICAL_STOCK_LIMIT &&
          item.quantity <= LOW_STOCK_LIMIT,
      )
      .map((item) => item.sku),
  );
  for (const sku of criticalProducts) lowProducts.delete(sku);

  return {
    productCount: products.length,
    totalUnits: inventory.reduce((total, item) => total + item.quantity, 0),
    criticalProductCount: criticalProducts.size,
    lowProductCount: lowProducts.size,
    estimatedValue: Number(
      inventory
        .reduce(
          (total, item) => total + item.quantity * item.estimatedUnitCost,
          0,
        )
        .toFixed(2),
    ),
    movementsToday: movements.filter(
      (movement) =>
        movement.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10),
    ).length,
    stockByBranch: totalsByBranch,
    topSellingProducts: [...products]
      .sort((a, b) => b.salesToday - a.salesToday)
      .slice(0, 5)
      .map(({ sku, name, salesToday }) => ({
        sku,
        product: name,
        quantity: salesToday,
      })),
    soonToRunOut: inventory
      .filter((item) => item.quantity <= LOW_STOCK_LIMIT)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 8)
      .map((item) => ({
        sku: item.sku,
        product: item.product,
        branch: item.branch,
        quantity: item.quantity,
        unit: item.unit,
        status: getStockStatus(item.quantity),
      })),
  };
}

export function recordMovement(input) {
  const { type, sku, quantity, branch, sourceBranch, destinationBranch } = input;

  if (!["purchase", "sale", "transfer"].includes(type)) {
    throw new InventoryError("Tipo de movimiento inválido.");
  }
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > MAX_MOVEMENT_QUANTITY) {
    throw new InventoryError(
      `La cantidad debe ser un entero entre 1 y ${MAX_MOVEMENT_QUANTITY}.`,
    );
  }

  const product = products.find((candidate) => candidate.sku === sku);
  if (!product) throw new InventoryError("No se encontró el producto solicitado.", 404);

  const getPosition = (targetBranch) => {
    if (!branches.includes(targetBranch)) {
      throw new InventoryError("La sucursal indicada no es válida.");
    }

    return inventory.find(
      (item) => item.sku === sku && item.branch === targetBranch,
    );
  };

  if (type === "purchase" || type === "sale") {
    const position = getPosition(branch);
    if (type === "sale" && position.quantity < quantity) {
      throw new InventoryError("La existencia no alcanza para registrar la salida.");
    }
    position.quantity += type === "purchase" ? quantity : -quantity;
  } else {
    if (sourceBranch === destinationBranch) {
      throw new InventoryError("El origen y destino deben ser sucursales distintas.");
    }

    const source = getPosition(sourceBranch);
    const destination = getPosition(destinationBranch);
    if (source.quantity < quantity) {
      throw new InventoryError("La existencia no alcanza para completar la transferencia.");
    }
    source.quantity -= quantity;
    destination.quantity += quantity;
  }

  const movement = {
    id: randomUUID(),
    type,
    sku,
    product: product.name,
    quantity,
    branch: type === "transfer" ? undefined : branch,
    sourceBranch: type === "transfer" ? sourceBranch : undefined,
    destinationBranch: type === "transfer" ? destinationBranch : undefined,
    createdAt: new Date().toISOString(),
  };
  movements.push(movement);

  return movement;
}

export function getInventoryContext() {
  return {
    branches,
    inventory: getInventory(),
    recommendations: getRecommendations(),
    dashboard: getDashboard(),
    rules: {
      normal: "más de 100 unidades",
      low: "de 30 a 100 unidades, inclusive",
      critical: "menos de 30 unidades",
      replenishment:
        "solo para existencias críticas: recomendar la cantidad necesaria para llegar a 100 unidades",
    },
    dataNotice: "Todas las cifras del inventario y los indicadores son datos simulados.",
  };
}

export const inventoryRules = {
  lowStockLimit: LOW_STOCK_LIMIT,
  criticalStockLimit: CRITICAL_STOCK_LIMIT,
  replenishmentTarget: REPLENISHMENT_TARGET,
};
