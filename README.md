# Almacén Inteligente Río Claro

Demo web del módulo de inventario. Usa existencias simuladas en memoria; no se conecta a un ERP ni crea órdenes de compra reales. `app.py` se conserva como referencia de la prueba de concepto anterior en Python.

## Requisitos

- Node.js 24.
- Para usar el chat IA: un proyecto de Azure AI Foundry, un despliegue de modelo y acceso mediante `DefaultAzureCredential`.

## Ejecutar localmente

```powershell
npm install
npm start
```

Abre <http://127.0.0.1:3000>. El servidor escucha solo en localhost por defecto. Los inventarios y movimientos se reinician al reiniciar el proceso.

El inventario, el dashboard, los movimientos y las sugerencias funcionan sin Azure. El chat responde con un error claro hasta que se configure Azure; no sustituye silenciosamente la IA por una respuesta simulada.

## Configurar Azure AI Foundry

1. Copia `.env.example` a `.env`.
2. Define `FOUNDRY_PROJECT_ENDPOINT` con el endpoint del proyecto de Foundry y `AZURE_AI_MODEL_DEPLOYMENT` con el nombre del despliegue.
3. Opcionalmente cambia `FOUNDRY_AGENT_NAME`; por defecto se usa `RioClaroWarehouseAgent`.
4. Inicia sesión localmente con Azure CLI (`az login`) usando una identidad con permisos para el proyecto, o configura `DefaultAzureCredential` con el método administrado por tu entorno.
5. Ejecuta `npm start`.

No pegues claves ni cadenas de conexión en el código, el chat o el repositorio. `.env` está excluido de Git. La aplicación intenta crear una versión del agente al iniciar cuando Azure está configurado. Si la identidad no tiene permisos o el endpoint/despliegue no es válido, el servidor registra el error y el endpoint del chat informa que no está disponible.

## Reglas y datos de demostración

- Normal: más de 100 unidades.
- Bajo: de 30 a 100 unidades, inclusive.
- Crítico: menos de 30 unidades.
- La sugerencia de compra solo incluye ubicaciones críticas y recomienda completar hasta 100 unidades.
- Cada movimiento valida que la cantidad sea un entero positivo y que una salida o transferencia no exceda las existencias.
- El valor estimado y las ventas del día también son cifras de demostración.

## API

- `GET /api/health`: estado del servidor y configuración/disponibilidad del chat IA.
- `GET /api/inventory`: inventario completo. Opcionales: `branch` y `search`.
- `GET /api/dashboard`: indicadores y series para las gráficas.
- `GET /api/recommendations`: recomendación determinista de reabastecimiento.
- `POST /api/movements`: registra una compra, venta o transferencia simulada.
- `POST /api/chat`: consulta el agente de Foundry con el inventario actual como contexto.

Ejemplo de entrada para compra o venta:

```json
{
  "type": "sale",
  "sku": "SKU-CL-001",
  "branch": "Guadalajara",
  "quantity": 3
}
```

Para transferir, usa `type: "transfer"` con `sourceBranch`, `destinationBranch` y `quantity`.

## Pruebas

```powershell
npm test
```

Las pruebas no necesitan credenciales de Azure. No despliegues esta demo en una red pública: no tiene autenticación, persistencia ni controles de acceso para usuarios reales.
