# Unified Event Analytics Engine

A scalable backend API for website and mobile app analytics that can track detailed user interactions, device metrics, and generate comprehensive analytics reports.

## Features

### API Key Management
- Register new websites/apps with Google OAuth
- Generate, retrieve, revoke, and regenerate API keys
- Support for API key expiration handling
- Secure API key storage and validation

### Event Data Collection
- Accept analytics events (clicks, visits, referrer info, device details)
- Automatic User-Agent parsing for browser and OS detection
- High-performance event ingestion with rate limiting
- IP address and device tracking

### Analytics & Reporting
- Event-based aggregation with time filters
- User-based analytics and stats
- Device breakdown and usage patterns
- Dashboard with comprehensive metrics
- Redis caching for optimal performance

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: Supabase (PostgreSQL)
- **Caching**: Redis
- **Authentication**: Google OAuth 2.0
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest & Supertest
- **Containerization**: Docker
- **Rate Limiting**: express-rate-limit

## Project Structure

```
src/
├── config/              # Configuration files (Supabase, Redis, Passport)
├── controllers/         # Business logic for auth and analytics
├── middleware/          # Authentication, API key validation, rate limiting
├── routes/              # API route definitions
├── utils/               # Utility functions (API key generation, caching)
├── tests/               # Test suites
└── server.js            # Main server file

Dockerfile              # Container configuration
docker-compose.yml      # Multi-container setup (API + Redis)
jest.config.js          # Test configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (for containerized deployment)
- Supabase account with database credentials
- Google OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/unified-event-analytics.git
cd unified-event-analytics
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure `.env` with your credentials:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

SESSION_SECRET=your_random_session_secret

REDIS_URL=redis://localhost:6379

PORT=3000
NODE_ENV=development
```

### Running Locally

```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:3000`
API Documentation: `http://localhost:3000/api-docs`

### Running with Docker

```bash
# Build and run with docker-compose (includes Redis)
npm run docker:run

# Or manually:
docker build -t analytics-api .
docker run -p 3000:3000 --env-file .env analytics-api
```

## API Endpoints

### Authentication

#### Google OAuth Login
```
GET /api/auth/google
```

#### Get Current User
```
GET /api/auth/me
```

#### Register New App
```
POST /api/auth/register
Body: { "name": "My Alter", "domain": "https://alteroffice.com" }
```

#### Get API Key
```
GET /api/auth/api-key?app_id=<uuid>
```

#### Revoke API Key
```
POST /api/auth/revoke
Body: { "api_key": "ak_xxx" }
```

#### Regenerate API Key
```
POST /api/auth/regenerate
Body: { "app_id": "<uuid>" }
```

#### Get User's Apps
```
GET /api/auth/apps
```

#### Logout
```
POST /api/auth/logout
```

### Analytics

#### Collect Event
```
POST /api/analytics/collect
Headers: { "x-api-key": "ak_xxx" }
Body: {
  "event": "login_form_cta_click",
  "url": "https://example.com/page",
  "referrer": "https://google.com",
  "device": "mobile",
  "ipAddress": "192.168.1.1",
  "timestamp": "2024-02-20T12:34:56Z",
  "userId": "user123",
  "metadata": {
    "browser": "Chrome",
    "os": "Android",
    "screenSize": "1080x1920"
  }
}
```

#### Get Event Summary
```
GET /api/analytics/event-summary?event=click&startDate=2024-02-15&endDate=2024-02-20&app_id=xyz123
```

Response:
```json
{
  "event": "click",
  "count": 3400,
  "uniqueUsers": 1200,
  "deviceData": {
    "mobile": 2200,
    "desktop": 1200
  }
}
```

#### Get User Stats
```
GET /api/analytics/user-stats?userId=user789&app_id=xyz123
```

Response:
```json
{
  "userId": "user789",
  "totalEvents": 150,
  "deviceDetails": {
    "browser": "Chrome",
    "os": "Android"
  },
  "ipAddress": "192.168.1.1"
}
```

#### Get Analytics Dashboard
```
GET /api/analytics/dashboard?app_id=xyz123&startDate=2024-02-15&endDate=2024-02-20
```


```