import express, { Request, Response, NextFunction } from "express";
import cors    from "cors";
import helmet  from "helmet";
import morgan  from "morgan";
import { router } from "./routes/launches.routes";
import { setupSwagger } from "./docs/swagger";
import { health } from "./controllers/launches.controller";
const app = express();
setupSwagger(app); // antes de las rutas


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));
app.get("/health", health);
app.use("/", router);

app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);  // ← ¿Está este console.error?
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
});

export default app;