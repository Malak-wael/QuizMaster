# Quiz Platform

A modern, interactive quiz platform supporting both teachers and students with features like quiz creation, tournaments, PDF uploads, and real-time results.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MySQL 8+ (for the API server)

### 1. Database
Create the schema (from the project root):

```bash
mysql -u root -p < backend/src/db/schema.sql
```

If you are upgrading an older database, apply migrations in order:

```bash
mysql -u root -p quizmaster < backend/sql/migration_002_user_email.sql
mysql -u root -p quizmaster < backend/sql/migration_003_quiz_columns.sql
```

### 2. Backend API
```bash
cd backend
cp .env.example .env
# Edit .env: JWT_SECRET, DB_PASSWORD, DB_USER, etc.

npm install
npm start
```

Runs at `http://localhost:3000` with REST base URL `http://localhost:3000/api` and WebSocket at `ws://localhost:3000`.

### 3. Frontend
From the project root:

```bash
cp .env.example .env
# VITE_API_BASE_URL defaults to http://localhost:3000/api

npm install
npm run dev
```

Vite serves the app at `http://localhost:5173`.

### Build (frontend only)
```bash
npm run build
npm run preview
```

## Documentation

For detailed documentation, please check the `/docs` folder:

- **[Frontend Documentation](docs/Frontend-README.md)** - Frontend architecture, components, and setup
- **[Backend Documentation](docs/Backend-README.md)** - Backend API, database schema, and implementation guide
- **[API Specification](docs/API-Specification.md)** - Complete API endpoints and WebSocket events

## Features

### Teacher Features
- Create and manage quizzes
- Upload PDF to auto-generate questions
- View student results and analytics
- Create and manage tournaments
- Real-time quiz monitoring

### Student Features
- Join quizzes via unique codes
- Interactive quiz taking experience
- View individual scores and rankings
- Participate in tournaments
- Real-time feedback

## Tech Stack

### Frontend
- React 18.2.0
- Vite 8.0.8
- Tailwind CSS 3.3.3
- React Router DOM 6.15.0
- Framer Motion 10.16.4
- Lucide React 0.279.0
- React Hot Toast 2.4.1

### Backend (Recommended)
- Node.js 18+
- Express.js/Fastify
- PostgreSQL/MongoDB
- Socket.io
- JWT Authentication
- PDF Processing

## Project Structure

```
quiz-platform/
  docs/                 # Documentation files
  src/
    components/         # Reusable UI components
    data/              # Mock data and API helpers
    layouts/           # Layout components
    pages/             # Page components
    assets/            # Static assets
    styles/            # Global styles
  public/              # Public assets
```

## Contributing

1. Read the documentation in the `/docs` folder
2. Follow the existing code style
3. Add components to appropriate directories
4. Update mock data when adding new features
5. Test on multiple screen sizes

## License

MIT License - see LICENSE file for details
