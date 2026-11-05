import express from "express";
import { branches } from "./data/inventory.js";
import {
  getDashboard,
  getInventory,
  getInventoryContext,
  getRecommendations,
  InventoryError,
  recordMovement,
} from "./services/inventoryService.js";
import { AiServiceError, createAiService } from "./services/aiService.js";

const app = express();
const aiService = createAiService({
  endpoint: process.env.FOUNDRY_PROJECT_ENDPOINT,
  deployment: process.env.AZURE_AI_MODEL_DEPLOYMENT,
  agentName: process.env.FOUNDRY_AGENT_NAME,
});

app.disable("x-powered-by");
app.use((request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:");
  next();
});
app.use(express.json({ limit: "16kb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    aiConfigured: aiService.configured,
    aiAvailable: aiService.available,
  });
});

app.get("/api/inventory", (request, response) => {
  const { branch, search } = request.query;
  if (branch && !branches.includes(branch)) {
    throw new InventoryError("La sucursal indicada no es válida.");
  }

  response.json({
    dataNotice: "Datos simulados para fines de demostración.",
    inventory: getInventory({
      branch,
      search: typeof search === "string" ? search : undefined,
    }),
  });
});

app.get("/api/dashboard", (_request, response) => {
  response.json({
    dataNotice: "Datos simulados para fines de demostración.",
    dashboard: getDashboard(),
  });
});

app.get("/api/recommendations", (_request, response) => {
  response.json({
    dataNotice: "Recomendaciones simuladas; no crean órdenes de compra.",
    policy: "Solo productos con menos de 30 unidades; reponer hasta 100.",
    recommendations: getRecommendations(),
  });
});

app.post("/api/movements", (request, response) => {
  if (!request.body || typeof request.body !== "object" || Array.isArray(request.body)) {
    throw new InventoryError("El cuerpo de la solicitud debe ser un objeto JSON.");
  }

  const movement = recordMovement(request.body);
  response.status(201).json({
    message: "Movimiento simulado registrado.",
    movement,
  });
});

app.post("/api/chat", async (request, response) => {
  const { message, previousResponseId } = request.body ?? {};
  if (typeof message !== "string" || !message.trim() || message.length > 4000) {
    throw new InventoryError(
      "Escribe una pregunta de hasta 4,000 caracteres.",
    );
  }
  if (
    previousResponseId !== undefined &&
    (typeof previousResponseId !== "string" ||
      previousResponseId.length > 200 ||
      !/^resp_[a-zA-Z0-9_-]+$/.test(previousResponseId))
  ) {
    throw new InventoryError("La referencia de conversación no es válida.");
  }

  const answer = await aiService.answer({
    message: message.trim(),
    previousResponseId,
    inventoryContext: getInventoryContext(),
  });
  response.json(answer);
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "No se encontró la ruta solicitada." });
});

app.use((error, _request, response, _next) => {
  if (error instanceof InventoryError || error instanceof AiServiceError) {
    return response.status(error.statusCode).json({ error: error.message });
  }
  if (error?.type === "entity.parse.failed") {
    return response.status(400).json({ error: "El cuerpo JSON no es válido." });
  }
  if (error?.type === "entity.too.large") {
    return response.status(413).json({ error: "La solicitud excede el tamaño permitido." });
  }

  console.error("Error inesperado en la API:", error);
  return response.status(500).json({
    error: "Ocurrió un error interno. Intenta de nuevo.",
  });
});

export async function initializeAi() {
  await aiService.initialize();
  if (!aiService.configured) {
    console.warn(
      "Azure AI no está configurado. El inventario y los movimientos funcionan; el chat informará que falta configurar Azure.",
    );
  }
}

export default app;
