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
│   ├── database/
│   ├── lib/
│   ├── index.ts
│   └── server.ts
├── config/
├── Dockerfile
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
Crea un archivo `.env` en la raíz.

```env
PORT=4000
TABLE_NAME=spaces_launches
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_DEFAULT_REGION=us-east-2
```

> ⚠️ En producción (ECS), las variables `TABLE_NAME` y `PORT` se inyectan desde **AWS Secrets Manager**. Las credenciales de AWS las provee automáticamente el rol de la Task Definition.

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

### Variables en Secrets Manager
Las siguientes variables se inyectan automáticamente al contenedor en ECS:

| Variable | Valor |
|----------|-------|
| `TABLE_NAME` | `spaces_launches` |
| `PORT` | `4000` |

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