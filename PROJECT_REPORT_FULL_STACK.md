# SignSync Full-Stack Project Report  
## Methodology, Architecture, and System Implementation

## 1. Project Overview

SignSync is a full-stack AI-assisted sign language platform with three core capabilities:

- Real-time sign-to-text recognition using MediaPipe landmarks and backend ML classification.
- Text-to-sign translation using an admin-managed sign image library.
- Role-based user and admin workflows for profile, analytics, system monitoring, and content management.

The system is split into:

- `frontend/`: Angular 21 standalone SPA.
- `backend/`: FastAPI async API + ML inference + PostgreSQL + Redis + optional worker/admin services.

---

## 2. Development Methodology

### 2.1 Process Model

The implementation follows an **iterative, feature-slice methodology**:

1. Define user-facing capability (for example, gesture detection, authentication, sign management).
2. Implement API contracts and domain models.
3. Implement frontend feature and route integration.
4. Add reliability and security controls (guards, JWT, rate limits, health checks).
5. Validate with targeted tests and manual workflow verification.

This incremental process reduced integration risk by delivering each vertical slice end-to-end.

### 2.2 Engineering Principles

- **Separation of concerns**: UI, API, business logic, persistence, and ML are modularized.
- **API versioning**: backend routes are grouped under `/api/v1`.
- **Asynchronous backend design**: async SQLAlchemy sessions and non-blocking request handlers.
- **Reactive frontend state**: Angular signals (`signal`, `computed`, `effect`) for predictable local state.
- **Operational readiness**: health/readiness endpoints, containerized deployment, and optional NGINX/Gunicorn profile.

### 2.3 Validation Strategy

- Frontend quality gates: Angular lint/build/test pipeline.
- Backend quality gates: pytest + static quality tooling via pyproject config.
- Runtime verification: `/health`, `/ready`, and admin system health endpoints.

---

## 3. System Architecture

### 3.1 High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│ Browser (Angular SPA)                                           │
│ - User/Admin UI                                                 │
│ - MediaPipe hand + face landmark extraction                     │
│ - Signal-based state + route guards + JWT handling              │
└───────────────┬──────────────────────────────┬──────────────────┘
                │ HTTP (REST)                  │ WebSocket
                │ /api/v1/...                  │ /api/v1/predict/ws
┌───────────────▼─────────────────────────────────────────────────┐
│ FastAPI Backend                                                 │
│ - Auth, user, admin, analytics, detection APIs                  │
│ - ML prediction service (SVM + MediaPipe features)              │
│ - Dashboard aggregation + alert dispatch                        │
└───────────────┬─────────────────────────────────────────────────┘
                │ 
        ┌────────▼────────┐                                   
        │ PostgreSQL      │             
        │ users/signs/... │             
        └─────────────────┘             
                │
        ┌───────▼───────────────┐
        │ External Services     │
        │ Cloudinary + SMTP     │
        └───────────────────────┘
```

### 3.2 Frontend Architectural Style

- Standalone Angular components with `OnPush` change detection.
- Lazy-loaded route groups (`user`, `auth`, `admin`) mounted under layout components.
- Shared API abstraction and interceptor-based token handling.
- Client-side ML preprocessing for low-latency hand landmark extraction.

### 3.3 Backend Architectural Style

- Layered API architecture:
  - Router layer (`api/v1/*`, `api/v1/admin/*`)
  - Dependency/security layer (auth, superuser checks, optional user/rate limits)
  - Service layer (dashboard analytics, email dispatch)
  - CRUD/data layer (FastCRUD + SQLAlchemy ORM models)
  - ML module (model loading + prediction paths)
- Startup lifecycle initializes DB resources, optional Redis pools, and ML model preload.

### 3.4 Deployment Architecture

- Container-first deployment with Docker Compose.
- Local profile: Uvicorn-based API execution.
- Production profile: Gunicorn + Uvicorn workers behind NGINX reverse proxy.
- Supporting services: PostgreSQL, Redis, optional worker and admin tooling.

---

## 4. System Implementation

### 4.1 Authentication and Session Flow

1. User submits login credentials from Angular sign-in page.
2. Backend validates credentials and returns:
   - access token (response payload),
   - refresh token (HttpOnly cookie).
3. Frontend stores access token and role, applies role-aware routing.
4. Interceptor attaches bearer token to API requests and triggers refresh on `401`.

### 4.2 Real-Time Sign Detection Flow

1. Frontend opens webcam and runs MediaPipe hand landmark extraction.
2. 21 landmarks are sent over WebSocket (`/api/v1/predict/ws`) as compact JSON.
3. Backend normalizes landmarks, runs SVM classifier, and returns label + confidence.
4. Frontend applies stability/confidence thresholds before committing letters.
5. Successful detections are logged in database for dashboard analytics.

### 4.3 Text-to-Sign Translation Flow

1. User enters text in translation page.
2. Frontend filters characters and builds a playback sequence.
3. Frontend retrieves sign image catalog via `/api/v1/signs`.
4. Animation renders each sign image with user-controlled speed and navigation.

### 4.4 Emergency Alert Flow

1. HELP sign detection or manual help action triggers alert endpoint.
2. Backend resolves user emergency contacts.
3. SMTP notification is sent with cooldown-based duplicate suppression.
4. Delivery status is returned to UI for user feedback.

### 4.5 Admin Content and System Operations

- Admin sign management:
  - upload/bulk upload,
  - version list,
  - active image switching,
  - deletion and fallback promotion.
- Admin analytics/system:
  - user growth analytics,
  - system health, active users,
  - cache clear,
  - backup metadata and snapshot management,
  - settings persistence.

### 4.6 Data Model (Core Entities)

- `User`: identity, credentials, profile, emergency contacts, role flags.
- `SignDetection`: detected sign, confidence, timing/session metadata.
- `Signs`: active Cloudinary URL and metadata per ASL character.
- `Tier` + `RateLimit`: tier-based API throttling model.

---

## 5. Non-Functional Characteristics

### 5.1 Performance

- Landmark streaming instead of image frames reduces WebSocket payload size significantly.
- Async backend I/O and connection pooling improve concurrent request handling.
- Frontend uses signal-based local state and `OnPush` rendering for efficient updates.

### 5.2 Security

- JWT access/refresh token model with token blacklist support on logout.
- Role-protected admin routes.
- Rate limiting by path and user tier.
- CORS and environment-bound deployment controls.

### 5.3 Reliability and Maintainability

- Modular code organization across frontend and backend.
- Health/readiness endpoints and admin diagnostics.
- Migration-ready schema evolution and explicit domain models.

---

## 6. Conclusion

SignSync is implemented as a production-oriented full-stack system that combines modern Angular frontend patterns, asynchronous FastAPI backend architecture, and ML-assisted sign recognition. The methodology emphasized iterative delivery, the architecture separates concerns cleanly, and the implementation integrates real-time inference, robust authentication, analytics, and admin operations in a cohesive platform suitable for both practical deployment and academic evaluation.

