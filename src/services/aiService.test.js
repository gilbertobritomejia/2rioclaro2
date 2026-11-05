import assert from "node:assert/strict";
import test from "node:test";
import { createAiService } from "./aiService.js";

test("informa claramente cuando Azure AI no está configurado", async () => {
  const service = createAiService({
    endpoint: "",
    deployment: "",
    agentName: "RioClaroWarehouseAgent",
  });
  await service.initialize();

  assert.equal(service.configured, false);
  assert.equal(service.available, false);
  await assert.rejects(
    service.answer({
      message: "¿Qué productos están críticos?",
      inventoryContext: {},
    }),
    (error) =>
      error.statusCode === 503 &&
      error.message.includes("FOUNDRY_PROJECT_ENDPOINT"),
  );
});
