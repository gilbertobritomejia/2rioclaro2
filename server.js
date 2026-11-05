import express from "express";
import path from "node:path";
import app, { initializeAi } from "./src/app.js";

app.use(express.static(path.join(import.meta.dirname, "public")));

await initializeAi();

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, host, () => {
  console.log(`Almacén Inteligente Río Claro disponible en http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close((error) => {
      if (error) {
        console.error("No se pudo cerrar el servidor correctamente:", error);
        process.exitCode = 1;
      }
    });
  });
}
