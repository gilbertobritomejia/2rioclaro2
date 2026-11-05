---
name: 'Backend Express'
description: 'Usar al crear o modificar el backend Node.js que llama a Microsoft Foundry.'
applyTo: 'server.js,src/**/*.js'
---
# Reglas del backend
- Crea el `AIProjectClient` y el cliente de OpenAI una sola vez al iniciar, no en cada request.
- Referencia al agente en cada `responses.create` con `{ body: { agent_reference: { name: AGENT_NAME, type: "agent_reference" } } }`.
- Usa `async/await` y maneja los errores del SDK con un error 502 genérico; registra el detalle en el servidor.
- Resuelve rutas de archivos con `import.meta.dirname` y `node:path`, no con el directorio actual.
- No agregues dependencias nuevas sin mencionarlas en el plan.