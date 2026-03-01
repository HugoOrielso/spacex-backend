import "dotenv/config";
import app from "./server";

const PORT =  4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server started successfully");
  console.log(`📍 API listening on port ${PORT}`);
  console.log(`📘 Swagger UI: /api-docs`);
});