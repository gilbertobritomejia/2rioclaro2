# MVP recomendado: "Almacén Inteligente Río Claro"
## Objetivo
Demostrar cómo la IA puede ayudar al control de inventarios y responder preguntas operativas en lenguaje natural.

Duración estimada: **6 a 10 horas**

## Catálogo de productos
En lugar de materiales de construcción, usar productos reales del negocio:

- Cloro Industrial

- Detergente Líquido

- Jabón Multiusos

- Desengrasante

- Sanitizante

- Limpiador de Pisos

- Papel Higiénico Industrial

- Toallas Interdobladas

- Bolsas para Basura

- Aromatizante

## Pantalla 1: Inventario


| Producto | Existencia | Sucursal |
| --- | --- | --- |
| Cloro Industrial | 240 | Guadalajara |
| Detergente Líquido | 120 | Zapopan |
| Desengrasante | 45 | León |
| Sanitizante | 15 | Querétaro |
Semáforo:

🟢 Stock suficiente

🟡 Stock bajo

🔴 Stock crítico

## Pantalla 2: Dashboard Gerencial
Indicadores:

- Productos en inventario

- Productos críticos

- Valor total estimado

- Movimientos del día

Gráficas:

- Inventario por sucursal

- Productos más vendidos

- Productos próximos a agotarse

## Pantalla 3: Asistente IA
Aquí está la parte que más llama la atención.
### Ejemplo 1
Usuario:

¿Qué productos necesitan reabasto urgente?

Respuesta:

Se detectan niveles críticos en Sanitizante (15 unidades) y Desengrasante (45 unidades).

### Ejemplo 2
Usuario:

¿Qué sucursal tiene más cloro industrial?

Respuesta:

Guadalajara tiene 240 unidades disponibles.

### Ejemplo 3
Usuario:

Resume el estado del almacén.

Respuesta:

El inventario presenta disponibilidad adecuada en el 85% de los productos. Dos artículos están en nivel crítico y se recomienda generar órdenes de compra durante esta semana.

# Funcionalidad "wow" en AI-901
Agregar un botón:
## Generar sugerencia de compra
La IA analiza inventarios y produce algo como:

Recomendación automática:

- Comprar 200 litros de Sanitizante.

- Comprar 150 litros de Desengrasante.

- No se requieren compras de Cloro Industrial.

Esto parece inteligencia de negocio aunque internamente sea una lógica sencilla apoyada por un prompt.

# Simulación de procesos completos
Aunque solo desarrolles almacén, puedes simular la integración con el resto del ERP.
### Entradas


| 1     `Compra recibida`2     `↓`3     `Aumenta inventario` |
| --- |
### Salidas


| 1     `Venta realizada`2     `↓`3     `Disminuye inventario` |
| --- |
### Transferencias


| 1     `Guadalajara`2     `↓`3     `León` |
| --- |
De esta forma explicas:

"Actualmente solo está implementado el módulo de almacén, pero la arquitectura está preparada para incorporar ventas, compras, cuentas por cobrar y cuentas por pagar."

