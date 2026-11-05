const formatNumber = new Intl.NumberFormat("es-MX");
const formatCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});
const statusNames = {
  normal: "Normal",
  low: "Bajo",
  critical: "Crítico",
};

const elements = {
  inventoryBody: document.querySelector("#inventory-body"),
  inventoryCount: document.querySelector("#inventory-count"),
  inventoryError: document.querySelector("#inventory-error"),
  search: document.querySelector("#inventory-search"),
  branchFilter: document.querySelector("#branch-filter"),
  movementForm: document.querySelector("#movement-form"),
  movementType: document.querySelector("#movement-type"),
  movementProduct: document.querySelector("#movement-product"),
  movementBranch: document.querySelector("#movement-branch"),
  sourceBranch: document.querySelector("#source-branch"),
  destinationBranch: document.querySelector("#destination-branch"),
  branchField: document.querySelector("#branch-field"),
  sourceField: document.querySelector("#source-field"),
  destinationField: document.querySelector("#destination-field"),
  movementMessage: document.querySelector("#movement-message"),
  recommendationButton: document.querySelector("#recommendation-button"),
  recommendations: document.querySelector("#recommendations"),
  chatForm: document.querySelector("#chat-form"),
  chatInput: document.querySelector("#chat-input"),
  chatSubmit: document.querySelector("#chat-submit"),
  chatMessages: document.querySelector("#chat-messages"),
  chatError: document.querySelector("#chat-error"),
  globalError: document.querySelector("#global-error"),
};

let branches = [];
let products = [];
let previousResponseId = null;
let searchTimer;
let globalErrorTimer;

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "No se pudo completar la solicitud.");
  }
  return payload;
}

function showGlobalError(message) {
  elements.globalError.textContent = message;
  elements.globalError.hidden = false;
  window.clearTimeout(globalErrorTimer);
  globalErrorTimer = window.setTimeout(() => {
    elements.globalError.hidden = true;
  }, 6000);
}

function setKpi(id, value) {
  document.querySelector(id).textContent = value;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderChart(containerId, rows, valueLabel, fillClass = "") {
  const container = document.querySelector(containerId);
  container.replaceChildren();
  const max = Math.max(...rows.map((row) => row.quantity), 1);

  for (const row of rows) {
    const line = element("div", "bar-row");
    const label = element("span", "bar-label", row.branch || row.product);
    const track = element("span", "bar-track");
    const fill = element("span", `bar-fill ${fillClass}`.trim());
    fill.style.width = `${Math.max((row.quantity / max) * 100, 1)}%`;
    track.append(fill);
    const value = element("span", "bar-value", `${formatNumber.format(row.quantity)} ${valueLabel}`);
    line.append(label, track, value);
    container.append(line);
  }
}

function renderAttention(rows) {
  const container = document.querySelector("#soon-list");
  container.replaceChildren();
  for (const row of rows) {
    const item = element("div", "attention-item");
    const text = element("span");
    text.append(element("strong", "", row.product));
    text.append(element("small", "", row.branch));
    const quantity = element(
      "span",
      `attention-qty ${row.status === "critical" ? "status-critical" : "status-low"}`,
      `${formatNumber.format(row.quantity)} ${row.unit}`,
    );
    item.append(text, quantity);
    container.append(item);
  }
  if (rows.length === 0) {
    container.append(element("p", "muted", "No hay productos con stock bajo o crítico."));
  }
}

async function loadDashboard() {
  const { dashboard } = await requestJson("/api/dashboard");
  setKpi("#kpi-products", formatNumber.format(dashboard.productCount));
  setKpi("#kpi-units", `${formatNumber.format(dashboard.totalUnits)} existencias totales`);
  setKpi("#kpi-critical", formatNumber.format(dashboard.criticalProductCount));
  setKpi("#kpi-low", `${formatNumber.format(dashboard.lowProductCount)} con stock bajo`);
  setKpi("#kpi-value", formatCurrency.format(dashboard.estimatedValue));
  setKpi("#kpi-movements", formatNumber.format(dashboard.movementsToday));
  renderChart("#branch-chart", dashboard.stockByBranch, "u");
  renderChart("#sales-chart", dashboard.topSellingProducts, "u", "bar-fill-sales");
  renderAttention(dashboard.soonToRunOut);
}

function createStatus(status) {
  return element("span", `status status-${status}`, statusNames[status]);
}

function renderInventory(rows) {
  elements.inventoryBody.replaceChildren();
  for (const row of rows) {
    const tableRow = document.createElement("tr");
    const productCell = document.createElement("td");
    productCell.className = "product-cell";
    productCell.append(element("span", "", row.product));
    productCell.append(element("small", "", row.sku));
    const categoryCell = element("td", "", row.category);
    const branchCell = element("td", "", row.branch);
    const quantityCell = element(
      "td",
      "quantity-cell",
      `${formatNumber.format(row.quantity)} ${row.unit}`,
    );
    const statusCell = document.createElement("td");
    statusCell.append(createStatus(row.status));
    tableRow.append(productCell, categoryCell, branchCell, quantityCell, statusCell);
    elements.inventoryBody.append(tableRow);
  }
  elements.inventoryCount.textContent = `${formatNumber.format(rows.length)} registros`;
  elements.inventoryError.hidden = true;
}

async function loadInventory() {
  const parameters = new URLSearchParams();
  if (elements.branchFilter.value) parameters.set("branch", elements.branchFilter.value);
  if (elements.search.value.trim()) parameters.set("search", elements.search.value.trim());
  const query = parameters.size ? `?${parameters.toString()}` : "";
  const { inventory } = await requestJson(`/api/inventory${query}`);
  renderInventory(inventory);
}

function fillSelect(select, options, placeholder) {
  select.replaceChildren();
  for (const option of options) {
    const item = document.createElement("option");
    item.value = option.value;
    item.textContent = option.label;
    select.append(item);
  }
  if (placeholder) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    option.disabled = true;
    option.selected = true;
    select.prepend(option);
  }
}

async function initializeInventoryControls() {
  const [response, health] = await Promise.all([
    requestJson("/api/inventory"),
    requestJson("/api/health"),
  ]);
  const assistantStatus = document.querySelector("#assistant-status");
  const assistantIndicator = document.querySelector("#assistant-indicator");
  if (health.aiAvailable) {
    assistantStatus.textContent = "Azure AI listo para consultas";
    assistantIndicator.setAttribute("aria-label", "Asistente disponible");
  } else {
    assistantStatus.textContent = health.aiConfigured
      ? "Azure AI no disponible; revisa la configuración"
      : "Chat IA sin configurar; el resto de la demo funciona";
    assistantIndicator.classList.add("offline-indicator");
    assistantIndicator.setAttribute("aria-label", "Asistente no disponible");
  }
  const uniqueProducts = new Map(
    response.inventory.map((item) => [item.sku, { value: item.sku, label: item.product }]),
  );
  products = [...uniqueProducts.values()];
  branches = [...new Set(response.inventory.map((item) => item.branch))];

  fillSelect(
    elements.branchFilter,
    [{ value: "", label: "Todas las sucursales" }, ...branches.map((branch) => ({ value: branch, label: branch }))],
  );
  fillSelect(elements.movementBranch, branches.map((branch) => ({ value: branch, label: branch })));
  fillSelect(elements.sourceBranch, branches.map((branch) => ({ value: branch, label: branch })));
  fillSelect(elements.destinationBranch, branches.map((branch) => ({ value: branch, label: branch })));
  fillSelect(elements.movementProduct, products);
}

function updateMovementFields() {
  const isTransfer = elements.movementType.value === "transfer";
  elements.branchField.hidden = isTransfer;
  elements.movementBranch.required = !isTransfer;
  elements.sourceField.hidden = !isTransfer;
  elements.destinationField.hidden = !isTransfer;
  elements.sourceBranch.required = isTransfer;
  elements.destinationBranch.required = isTransfer;
}

async function refreshViews() {
  try {
    await Promise.all([loadDashboard(), loadInventory()]);
  } catch (error) {
    showGlobalError(error.message);
  }
}

function appendMessage(role, text) {
  const message = element("div", `message message-${role}`);
  message.append(element("p", "", text));
  elements.chatMessages.append(message);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  return message;
}

async function handleMovement(event) {
  event.preventDefault();
  elements.movementMessage.textContent = "";
  elements.movementMessage.dataset.kind = "";
  const form = new FormData(elements.movementForm);
  const type = form.get("type");
  const payload = {
    type,
    sku: form.get("sku"),
    quantity: Number(form.get("quantity")),
  };
  if (type === "transfer") {
    payload.sourceBranch = form.get("sourceBranch");
    payload.destinationBranch = form.get("destinationBranch");
  } else {
    payload.branch = form.get("branch");
  }

  const submitButton = elements.movementForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const result = await requestJson("/api/movements", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    elements.movementMessage.textContent = result.message;
    elements.movementForm.reset();
    updateMovementFields();
    await refreshViews();
    if (!elements.recommendations.dataset.loaded) return;
    await loadRecommendations();
  } catch (error) {
    elements.movementMessage.textContent = error.message;
    elements.movementMessage.dataset.kind = "error";
  } finally {
    submitButton.disabled = false;
  }
}

async function loadRecommendations() {
  elements.recommendationButton.disabled = true;
  elements.recommendationButton.textContent = "Calculando…";
  try {
    const { recommendations } = await requestJson("/api/recommendations");
    elements.recommendations.replaceChildren();
    elements.recommendations.dataset.loaded = "true";
    if (recommendations.length === 0) {
      elements.recommendations.append(
        element("p", "muted", "No hay existencias críticas que requieran recomendación."),
      );
      return;
    }

    for (const recommendation of recommendations) {
      const item = element("div", "recommendation-item");
      item.append(element("strong", "", recommendation.product));
      item.append(
        element(
          "span",
          "",
          `${recommendation.branch}: pedir ${formatNumber.format(recommendation.recommendedQuantity)} ${recommendation.unit}`,
        ),
      );
      elements.recommendations.append(item);
    }
  } catch (error) {
    elements.recommendations.replaceChildren(element("p", "inline-error", error.message));
  } finally {
    elements.recommendationButton.disabled = false;
    elements.recommendationButton.textContent = "Generar sugerencia";
  }
}

async function handleChat(event) {
  event.preventDefault();
  const message = elements.chatInput.value.trim();
  if (!message) return;
  elements.chatError.hidden = true;
  appendMessage("user", message);
  elements.chatInput.value = "";
  elements.chatSubmit.disabled = true;
  elements.chatSubmit.setAttribute("aria-label", "Escribiendo");
  const typing = appendMessage("assistant", "Escribiendo…");

  try {
    const answer = await requestJson("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        ...(previousResponseId ? { previousResponseId } : {}),
      }),
    });
    typing.querySelector("p").textContent = answer.response;
    previousResponseId = answer.responseId;
  } catch (error) {
    typing.remove();
    elements.chatError.textContent = error.message;
    elements.chatError.hidden = false;
  } finally {
    elements.chatSubmit.disabled = false;
    elements.chatSubmit.setAttribute("aria-label", "Enviar mensaje");
  }
}

elements.search.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    loadInventory().catch((error) => {
      elements.inventoryError.textContent = error.message;
      elements.inventoryError.hidden = false;
    });
  }, 180);
});
elements.branchFilter.addEventListener("change", () => {
  loadInventory().catch((error) => showGlobalError(error.message));
});
elements.movementType.addEventListener("change", updateMovementFields);
elements.movementForm.addEventListener("submit", handleMovement);
elements.recommendationButton.addEventListener("click", loadRecommendations);
elements.chatForm.addEventListener("submit", handleChat);
document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", () => {
    elements.chatInput.value = button.dataset.question;
    elements.chatInput.focus();
  });
});

try {
  await initializeInventoryControls();
  updateMovementFields();
  await refreshViews();
} catch (error) {
  showGlobalError(error.message);
}
