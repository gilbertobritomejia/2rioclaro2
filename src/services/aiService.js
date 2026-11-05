import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

const AGENT_INSTRUCTIONS = `
Eres RioClaroWarehouseAgent, un asistente especializado en operaciones de almacén e inventarios de Río Claro.
Responde en español, de forma profesional, concisa y orientada a la acción.
Usa únicamente los datos actuales incluidos en cada consulta. No inventes cifras ni supongas que los datos simulados son reales.
Clasifica como crítico solo el stock menor a 30; de 30 a 100 inclusive es bajo; mayor a 100 es normal.
Recomienda reabastecer únicamente ubicaciones críticas, hasta llegar a 100 unidades.
No afirmes que creaste o enviaste órdenes de compra: solo puedes ofrecer recomendaciones.
Si preguntan algo ajeno a inventario/almacén, explica brevemente que ese es tu único dominio.
`;

export class AiServiceError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = "AiServiceError";
    this.statusCode = statusCode;
  }
}

export function createAiService({ endpoint, deployment, agentName }) {
  let openAIClient;
  let initializationError;
  const configured = Boolean(endpoint && deployment);
  const resolvedAgentName = agentName || "RioClaroWarehouseAgent";

  return {
    get configured() {
      return configured;
    },

    get available() {
      return Boolean(openAIClient);
    },

    async initialize() {
      if (!configured) {
        initializationError =
          "El asistente IA no está configurado. Define FOUNDRY_PROJECT_ENDPOINT y AZURE_AI_MODEL_DEPLOYMENT en .env.";
        return;
      }

      try {
        const project = new AIProjectClient(
          endpoint,
          new DefaultAzureCredential(),
        );
        let currentAgent;
        try {
          currentAgent = await project.agents.get(resolvedAgentName);
        } catch (error) {
          if (error.statusCode !== 404) throw error;
        }

        const currentDefinition = currentAgent?.versions?.latest?.definition;
        const hasCurrentDefinition =
          currentDefinition?.kind === "prompt" &&
          currentDefinition.model === deployment &&
          currentDefinition.instructions === AGENT_INSTRUCTIONS;
        if (!hasCurrentDefinition) {
          await project.agents.createVersion(resolvedAgentName, {
            kind: "prompt",
            model: deployment,
            instructions: AGENT_INSTRUCTIONS,
          });
        }
        openAIClient = project.getOpenAIClient();
      } catch (error) {
        initializationError = "No fue posible inicializar el asistente de Azure AI.";
        console.error("Error al inicializar Azure AI Foundry:", error);
      }
    },

    async answer({ message, previousResponseId, inventoryContext }) {
      if (!openAIClient) {
        throw new AiServiceError(
          initializationError ||
            "El asistente IA no está disponible en este momento.",
          configured ? 502 : 503,
        );
      }

      const input = [
        "Contexto actual de inventario (datos de demostración):",
        JSON.stringify(inventoryContext),
        "",
        "Pregunta del usuario:",
        message,
      ].join("\n");

      try {
        const response = await openAIClient.responses.create(
          {
            input,
            ...(previousResponseId
              ? { previous_response_id: previousResponseId }
              : {}),
          },
          {
            body: {
              agent_reference: {
                name: resolvedAgentName,
                type: "agent_reference",
              },
            },
          },
        );

        if (!response.output_text) {
          throw new AiServiceError(
            "Azure AI no devolvió una respuesta de texto.",
            502,
          );
        }

        return {
          response: response.output_text,
          responseId: response.id,
        };
      } catch (error) {
        if (error instanceof AiServiceError) throw error;
        console.error("Error al consultar Azure AI Foundry:", error);
        throw new AiServiceError(
          "No se pudo completar la consulta al asistente IA.",
          502,
        );
      }
    },
  };
}
