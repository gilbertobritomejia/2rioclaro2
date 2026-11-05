# Almacén Inteligente Río Claro

## Descripción General

Esta aplicación es un MVP (Producto Mínimo Viable) denominado **Almacén Inteligente Río Claro**.

Río Claro es una empresa distribuidora de productos de limpieza con múltiples sucursales.

El objetivo de la aplicación es demostrar cómo la Inteligencia Artificial puede apoyar la gestión de inventarios mediante consultas en lenguaje natural, monitoreo de existencias y recomendaciones de abastecimiento.

La solución forma parte de una visión futura para una plataforma empresarial inteligente integrada.

---

# Objetivo del Proyecto

Construir una aplicación web simple que permita:

- Visualizar inventarios.
- Consultar existencias por producto y sucursal.
- Detectar productos con inventario bajo o crítico.
- Generar recomendaciones de compra.
- Obtener resúmenes ejecutivos mediante IA.
- Interactuar mediante un chatbot especializado en operaciones de almacén.

---

# Contexto de Negocio

La empresa comercializa productos de limpieza e higiene institucional.

Ejemplos de productos:

- Cloro Industrial
- Detergente Líquido
- Sanitizante
- Desengrasante
- Limpiador Multiusos
- Papel Higiénico Industrial
- Toallas Interdobladas
- Bolsas para Basura
- Aromatizante Ambiental

Sucursales:

- Guadalajara
- Zapopan
- León
- Querétaro
- Aguascalientes

---

# Stack de desarrollo
- node 24

# Alcance del MVP

La aplicación incluye únicamente:

## Dashboard

Mostrar:

- Total de productos
- Total de existencias
- Productos en stock crítico
- Productos en stock bajo
- Sucursal con mayor inventario
- Sucursal con menor inventario

## Inventario

Visualizar:

- Producto
- Categoría
- Sucursal
- Existencia
- Estado

Estados válidos:

- Normal
- Bajo
- Crítico

## Chat IA

Responde preguntas relacionadas con:

- Inventarios
- Existencias
- Productos críticos
- Reabastecimiento
- Resúmenes ejecutivos

---

# Arquitectura Técnica

## Frontend

Utilizar:

- HTML5
- CSS3
- JavaScript Vanilla

Opcional:

- Bootstrap 5

Diseño:

- Responsive
- Corporativo
- Minimalista

---

## Backend

Utilizar:

- Node.js
- Express 5
- ES Modules

Estructura recomendada:

src/
├── routes/
├── services/
├── controllers/
├── agents/
├── data/
├── public/
└── app.js

---

## Inteligencia Artificial

Utilizar:

- Azure AI Foundry
- Azure OpenAI

Modelo recomendado:

- GPT-4.1-mini

Crear un único agente:

RioClaroWarehouseAgent

---

# Personalidad del Agente

Actúa como un supervisor experto de almacén.

Características:

- Profesional
- Preciso
- Conciso
- Orientado a operaciones
- Enfocado en resultados

Evita:

- Explicaciones excesivas
- Información irrelevante
- Respuestas genéricas

---

# Funciones del Agente

El agente debe ser capaz de:

1. Consultar inventarios.
2. Detectar niveles críticos.
3. Recomendar reabastecimiento.
4. Generar resúmenes ejecutivos.
5. Responder preguntas de operación.

---

# Reglas de Inventario

Determinar el estado del producto usando:

Normal:

existencia > 100

Bajo:

existencia >= 30 && existencia <= 100

Crítico:

existencia < 30

Cuando un producto sea crítico, sugerir una compra inmediata.

---

# Ejemplos de Preguntas

## Existencias

Usuario:

¿Cuánto cloro industrial hay en Guadalajara?

Respuesta:

Hay 240 unidades disponibles de Cloro Industrial en Guadalajara.

---

## Stock crítico

Usuario:

¿Qué productos están críticos?

Respuesta:

Los productos con inventario crítico son:

- Sanitizante
- Desengrasante

---

## Reabasto

Usuario:

¿Qué productos debería comprar?

Respuesta:

Se recomienda reabastecer:

- Sanitizante
- Desengrasante

La prioridad es alta debido a los niveles actuales de inventario.

---

## Resumen ejecutivo

Usuario:

Resume el almacén.

Respuesta:

La operación presenta inventario adecuado en la mayoría de los productos. Existen dos productos en estado crítico que requieren atención inmediata.

---

# Estructura de Datos

Utilizar una fuente de datos simulada.

Ejemplo:

{
  "producto": "Cloro Industrial",
  "sucursal": "Guadalajara",
  "existencia": 240,
  "estado": "Normal"
}

No utilizar base de datos en la primera versión.

Preferir:

- JSON
- Datos mock
- Datos simulados

---

# API REST

## Inventario

GET /api/inventory

Retorna listado completo de inventario.

---

## Dashboard

GET /api/dashboard

Retorna KPIs.

---

## Chat

POST /api/chat

Solicitud:

{
  "message": "¿Qué productos están críticos?"
}

Respuesta:

{
  "response": "Sanitizante y Desengrasante tienen inventario crítico."
}

---

# Interfaz de Usuario

La página principal debe contener:

1. Encabezado principal.
2. Tarjetas KPI.
3. Tabla de inventario.
4. Panel de recomendaciones.
5. Chat IA.

Todo en una sola pantalla.

---

# Buenas Prácticas

Siempre:

- Utilizar código limpio.
- Aplicar principios SOLID cuando sea posible.
- Separar responsabilidades.
- Utilizar nombres descriptivos.
- Mantener componentes reutilizables.
- Documentar funciones complejas.

---

# Objetivo de la Demostración

El propósito principal de este MVP es demostrar cómo la Inteligencia Artificial puede mejorar la gestión de inventarios y servir como base para una futura plataforma empresarial inteligente para Río Claro.

La experiencia debe transmitir simplicidad, utilidad operativa y potencial de crecimiento.