# 🏗️ Arquitectura del Sistema — SpaceX Launches

Este documento describe cómo interactúan todos los componentes del sistema.

---

## 📐 Diagrama general

```
┌─────────────────────────────────────────────────────────────────────┐
│                          INTERNET                                   │
└───────────────┬─────────────────────────────┬───────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────┐       ┌─────────────────────────┐
│   spacex-alb          │       │   spacex-backend-alb    │
│  (Frontend ALB)       │       │   (Backend ALB)         │
│  Puerto 80            │       │   Puerto 80             │
└──────────┬────────────┘       └────────────┬────────────┘
           │                                 │
           ▼                                 ▼
┌───────────────────────┐       ┌─────────────────────────┐
│   ECS Fargate         │       │   ECS Fargate           │
│   spacex-service      │       │   spacex-backend-service│
│   Next.js (3000)      │──────▶│   Express API (4000)    │
└───────────────────────┘       └────────────┬────────────┘
                                             │
                                             ▼
                                ┌─────────────────────────┐
                                │   Amazon DynamoDB       │
                                │   spaces_launches       │
                                │   (205 registros)       │
                                └────────────▲────────────┘
                                             │
                                ┌────────────┴────────────┐
                                │   AWS Lambda            │
                                │   spacex-launches-      │
                                │   handler (Python)      │
                                └────────────▲────────────┘
                                             │
                                ┌────────────┴────────────┐
                                │   EventBridge           │
                                │   cada 6 horas          │
                                └────────────▲────────────┘
                                             │
                                ┌────────────┴────────────┐
                                │   SpaceX API            │
                                │   api.spacexdata.com    │
                                │   /v4/launches          │
                                └─────────────────────────┘
```

---

## 🔄 Flujo de datos

### 1. Ingesta de datos (automática cada 6h)
```
EventBridge (rate: 6 hours)
    │
    ▼
Lambda (spacex-launches-handler)
    │  GET /v4/launches
    ▼
SpaceX API
    │  Lista de lanzamientos (JSON)
    ▼
Lambda: transform + upsert
    │
    ▼
DynamoDB (spaces_launches)
```

### 2. Consulta desde el frontend
```
Usuario (navegador)
    │  HTTP GET /
    ▼
ALB Frontend (spacex-alb)
    │
    ▼
ECS Fargate - Next.js
    │  HTTP GET /launches
    │  HTTP GET /stats/summary
    │  HTTP GET /stats/by-year
    ▼
ALB Backend (spacex-backend-alb)
    │
    ▼
ECS Fargate - Express API
    │  Scan + Filter
    ▼
DynamoDB (spaces_launches)
    │  Items
    ▼
Express API → Next.js → Usuario
```

### 3. Invocación manual de la Lambda
```
Developer / Evaluador
    │  HTTP GET
    ▼
Lambda Function URL
https://x2j244r7gcqo4bljyuqnwifayi0ruvxm.lambda-url.us-east-2.on.aws/
    │
    ▼
Lambda: process_launches()
    │
    ▼
Retorna resumen JSON:
{
  "total_from_api": 205,
  "inserted_or_updated": 205,
  "skipped": 0
}
```

---

## 🚀 Flujo CI/CD

```
Developer
    │  git push origin main
    ▼
GitHub (rama main)
    │
    ├──▶ Workflow: deploy-lambda.yml
    │        │
    │        ├─ JOB: test
    │        │    └─ pytest (cobertura mínima 80%)
    │        │
    │        └─ JOB: deploy (si tests pasan)
    │             ├─ Build .zip
    │             └─ aws lambda update-function-code
    │
    ├──▶ Workflow: deploy-backend.yml
    │        │
    │        ├─ JOB: test
    │        │    └─ pnpm test (15 pruebas)
    │        │
    │        └─ JOB: deploy (si tests pasan)
    │             ├─ docker build + push → ECR
    │             └─ ECS update-service → Fargate
    │
    └──▶ Workflow: deploy.yml (frontend)
             │
             └─ JOB: deploy
                  ├─ docker build + push → ECR
                  └─ ECS update-service → Fargate
```

---

## ☁️ Infraestructura AWS

```
AWS Account (148761674962) — us-east-2
│
├── IAM
│   ├── spacex-dev (usuario CLI)
│   ├── ecsTaskExecutionRole
│   └── spacex-lambda-execution-role
│
├── ECR
│   ├── spacex-frontend
│   └── spacex-backend
│
├── ECS
│   └── Cluster: spacex-cluster
│       ├── Service: spacex-service (frontend)
│       │   └── Task: spacex-task
│       └── Service: spacex-backend-service
│           └── Task: spacex-backend-task
│
├── EC2 / Networking
│   ├── VPC: vpc-047cd1aa2bed5bee2
│   ├── Subnets: us-east-2a, us-east-2b, us-east-2c
│   ├── SG: spacex-alb-sg (puertos 80, 443)
│   └── SG: spacex-ecs-sg (puerto 3000/4000 desde ALB)
│
├── ELB
│   ├── spacex-alb → spacex-tg (puerto 3000)
│   └── spacex-backend-alb → spacex-backend-tg (puerto 4000)
│
├── Lambda
│   └── spacex-launches-handler (Python 3.11)
│       ├── Trigger: EventBridge (cada 6h)
│       └── Function URL (invocación manual)
│
├── DynamoDB
│   └── spaces_launches
│       └── PK: launch_id (String)
│
└── Secrets Manager
    └── spacex-backend-secrets
        ├── TABLE_NAME
        └── PORT
```

---

## 🔗 URLs públicas

| Componente | URL |
|------------|-----|
| Frontend | http://spacex-alb-110258141.us-east-2.elb.amazonaws.com |
| Backend API | http://spacex-backend-alb-574561858.us-east-2.elb.amazonaws.com |
| Swagger UI | http://spacex-backend-alb-574561858.us-east-2.elb.amazonaws.com/api-docs |
| Lambda (manual) | https://x2j244r7gcqo4bljyuqnwifayi0ruvxm.lambda-url.us-east-2.on.aws/ |