config(); 
import express, { Request, Response, NextFunction } from "express";
import cors    from "cors";
import helmet  from "helmet";
import morgan  from "morgan";
import {config} from "dotenv";
import { router } from "./routes/launches.routes";
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

app.use("/", router);

app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
});

export default app;