# Phoenix Explorer API

REST API server for Phoenix Explorer, built with Express, TypeScript, and PostgreSQL.

## Features

- ✅ RESTful API endpoints
- ✅ TDD (Test-Driven Development)
- ✅ ISP (Interface Segregation Principle)
- ✅ Clean Architecture
- ✅ TypeScript
- ✅ PostgreSQL integration
- ✅ Error handling middleware
- ✅ Request validation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
PORT=3000
DATABASE_URL=postgresql://phoenix:phoenix_dev@localhost:6660/phoenix_explorer?sslmode=disable
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Tests

```bash
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

## API Endpoints

### Health Check

```
GET /health
```

### Blocks

```
GET /v1/blocks/latest?limit=20
GET /v1/blocks/:blockNumber
GET /v1/blocks/hash/:hash
```

## Architecture

- **Interfaces**: ISP-compliant interface definitions
- **Services**: Business logic layer
- **Repositories**: Data access layer
- **Controllers**: HTTP request handlers
- **Middleware**: Error handling, validation
- **Routes**: Express route definitions

## Testing

All code follows TDD principles:
- Tests written first
- Implementation follows tests
- High test coverage (>80%)

## License

MIT

