import "dotenv/config";
import app from "./server";

const PORT = process.env.PORT ?? 4000;
const BASE_URL = `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log("🚀 Server started successfully");
  console.log(`📍 API:        ${BASE_URL}`);
  console.log(`📘 Swagger UI: ${BASE_URL}/api-docs`);
  console.log(`📄 OpenAPI:    ${BASE_URL}/api-docs.json`);
});