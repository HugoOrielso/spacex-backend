# 🚀 SpaceX Launches — Backend API

API REST construida con **Node.js + Express + TypeScript** que expone los datos de lanzamientos espaciales almacenados en Amazon DynamoDB. Desplegada en **Amazon ECS Fargate** con integración continua mediante **GitHub Actions**.

---

## 🌐 URLs públicas

| Recurso | URL |
|---------|-----|
| **API Base** | http://spacex-backend-alb-574561858.us-east-2.elb.amazonaws.com |
| **Swagger UI** | http://spacex-backend-alb-574561858.us-east-2.elb.amazonaws.com/api-docs |
| **Health Check** | http://spacex-backend-alb-574561858.us-east-2.elb.amazonaws.com/health |

---

## 📐 Arquitectura

```
Cliente / Frontend
        │
        ▼
Application Load Balancer (puerto 80)
        │
        ▼
ECS Fargate (spacex-backend-service)
        │
        ▼
Express API (puerto 4000)
        │
        ▼
Amazon DynamoDB (spaces_launches)
```

---

## 📁 Estructura del repositorio

```
backend/
├── src/
│   ├── controllers/
│   │   └── launches.controller.ts
│   ├── routes/
│   │   └── launches.routes.ts
│   ├── docs/
│   │   └── swagger.ts
│   ├── database/
│   ├── lib/
│   ├── index.ts
│   └── server.ts
├── config/
├── Dockerfile
├── task-definition.json
├── .env.example
├── package.json
├── tsconfig.json
└── .github/
    └── workflows/
        └── deploy-backend.yml
```

---

## 🔌 Endpoints

### Health
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Verifica que el servidor esté activo |

### Lanzamientos
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/launches` | Lista todos los lanzamientos |
| `GET` | `/launches/:id` | Obtiene un lanzamiento por ID |

### Estadísticas
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/stats/summary` | Resumen general de lanzamientos |
| `GET` | `/stats/by-year` | Lanzamientos agrupados por año |

### Documentación
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api-docs` | Swagger UI interactivo |

---

## ⚙️ Configuración del servidor (`server.ts`)

El servidor está configurado para registrar el **health check siempre como primera ruta**, antes de cualquier middleware o router. Esto garantiza que ECS Fargate pueda verificar el estado del contenedor sin interferencias.

```typescript
const app = express();

setupSwagger(app);          // Swagger antes de las rutas

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));

app.get("/health", health); // ✅ Health check registrado primero
app.use("/", router);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Error handler
app.use((err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: message });
});
```

> ⚠️ **Importante:** `/health` debe registrarse **antes** del router principal para que el health check de ECS funcione correctamente desde el inicio del ciclo de vida del contenedor.

---

## 🛠️ Correr localmente

### Prerrequisitos
- Node.js 20+
- pnpm
- Credenciales AWS configuradas con acceso a DynamoDB

### Instalación
```bash
pnpm install
```

### Variables de entorno
Crea un archivo `.env` en la raíz:

```env
PORT=4000
TABLE_NAME=spaces_launches
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_DEFAULT_REGION=us-east-2
```

> ⚠️ En producción (ECS), las variables `TABLE_NAME` y `PORT` se inyectan desde **AWS Secrets Manager**. La variable `AWS_DEFAULT_REGION` se inyecta como variable de entorno directa en la task definition. Las credenciales de AWS las provee automáticamente el rol de la Task Definition.

### Correr en desarrollo
```bash
pnpm dev
```

### Build de producción
```bash
pnpm build
pnpm start
```

---

## 🐳 Docker

### Build de la imagen
```bash
docker build -t spacex-backend .
```

### Correr el contenedor
```bash
docker run -p 4000:4000 \
  -e TABLE_NAME=spaces_launches \
  -e PORT=4000 \
  -e AWS_ACCESS_KEY_ID=tu_key \
  -e AWS_SECRET_ACCESS_KEY=tu_secret \
  -e AWS_DEFAULT_REGION=us-east-2 \
  spacex-backend
```

### Verificar
```bash
curl http://localhost:4000/health
```

---

## 🔁 Pipeline CI/CD (GitHub Actions)

El workflow `.github/workflows/deploy-backend.yml` se activa con cada push a `main`.

### Flujo del pipeline

```
Push a main
    │
    ▼
┌─────────────────────────────────┐
│  1. Checkout código             │
│  2. Configurar credenciales AWS │
│  3. Login a Amazon ECR          │
│  4. Build imagen Docker         │
│  5. Push imagen a ECR           │
│  6. Descargar task definition   │
│  7. Actualizar imagen en task   │
│  8. Deploy en ECS Fargate       │
│  9. Esperar estabilidad         │
└─────────────────────────────────┘
```

### Secrets requeridos en GitHub

Ve a **Settings → Secrets and variables → Actions** y agrega:

| Secret | Descripción |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | Access key de IAM |
| `AWS_SECRET_ACCESS_KEY` | Secret key de IAM |
| `AWS_REGION` | `us-east-2` |

---

## ☁️ Infraestructura en AWS

| Recurso | Nombre |
|---------|--------|
| ECR Repository | `spacex-backend` |
| ECS Cluster | `spacex-cluster` |
| ECS Service | `spacex-backend-service` |
| Task Definition | `spacex-backend-task` |
| Load Balancer | `spacex-backend-alb` |
| Target Group | `spacex-backend-tg` |
| Secrets Manager | `spacex-backend-secrets` |

---

## 📋 Task Definition

La task definition está versionada en `task-definition.json`. Configuración relevante:

| Parámetro | Valor |
|-----------|-------|
| Family | `spacex-backend-task` |
| CPU | `256` (0.25 vCPU) |
| Memory | `512 MB` |
| Network Mode | `awsvpc` |
| Launch Type | `FARGATE` |
| Container Port | `4000` |
| Imagen ECR | `148761674962.dkr.ecr.us-east-2.amazonaws.com/spacex-backend:latest` |

### Variables de entorno del contenedor

Las variables se dividen en dos grupos según su origen:

**Inyectadas desde AWS Secrets Manager** (`secrets`):

| Variable | ARN Secret |
|----------|-----------|
| `TABLE_NAME` | `spacex-backend-secrets-VBy5gf:TABLE_NAME` |
| `PORT` | `spacex-backend-secrets-VBy5gf:PORT` |

**Inyectadas directamente como variable de entorno** (`environment`):

| Variable | Valor |
|----------|-------|
| `AWS_DEFAULT_REGION` | `us-east-2` |

### Health Check (ECS)

El contenedor incluye un health check nativo de ECS que garantiza que el servicio solo reciba tráfico cuando esté listo:

```json
{
  "command": ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"],
  "interval": 30,
  "timeout": 5,
  "retries": 3,
  "startPeriod": 60
}
```

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `interval` | 30s | Tiempo entre chequeos |
| `timeout` | 5s | Tiempo máximo de respuesta |
| `retries` | 3 | Intentos antes de marcar unhealthy |
| `startPeriod` | 60s | Gracia inicial al arrancar el contenedor |

### Logs (CloudWatch)

Los logs del contenedor se envían automáticamente a CloudWatch:

| Parámetro | Valor |
|-----------|-------|
| Log Group | `/ecs/spacex-backend` |
| Región | `us-east-2` |
| Stream Prefix | `ecs` |

---

## 📖 Swagger

La documentación interactiva de la API está disponible en:

```
http://spacex-backend-alb-574561858.us-east-2.elb.amazonaws.com/api-docs
```

Permite explorar y probar todos los endpoints directamente desde el navegador.

---

## 🔗 Recursos relacionados

- [Express.js Docs](https://expressjs.com/)
- [Amazon ECS Docs](https://docs.aws.amazon.com/ecs/)
- [Amazon DynamoDB Docs](https://docs.aws.amazon.com/dynamodb/)
- [Frontend App](http://spacex-alb-110258141.us-east-2.elb.amazonaws.com)