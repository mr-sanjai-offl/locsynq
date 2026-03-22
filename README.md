# Locsynq

**Offline-first LAN-based bucket sharing platform** for fast, secure file, text, and link distribution across local networks. Built for labs, offices, and classrooms with real-time sync, PIN-protected access, and high-performance file streaming.

## ✨ Features

- **Local Buckets** — Create shared buckets visible to all devices on your LAN
- **File Sharing** — Stream large files (1GB+) with chunked upload and progress tracking
- **Text & Links** — Share text notes and website links instantly
- **Real-Time Sync** — WebSocket-powered live updates across all connected devices
- **PIN Protection** — Optional PIN-based access control with JWT session tokens
- **Auto-Discovery** — mDNS device discovery with QR code fallback
- **Temporary Buckets** — Auto-expiring buckets for time-limited sharing
- **Offline First** — Works entirely without internet

## 🏗️ Architecture

```
[ Host Device ]
├── Node.js Backend (Express + WebSocket + mDNS)
│   ├── REST API (/api/bucket/*)
│   ├── WebSocket Server (/ws)
│   ├── File Storage (streaming)
│   └── mDNS Broadcaster
│
└── React Frontend (Vite + Tailwind + Zustand)
    ├── Discovery Page (radar UI, QR code)
    ├── Bucket Viewer (files, text, links tabs)
    ├── Upload System (drag & drop, progress)
    └── PIN Modal (protected buckets)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# Install dependencies
npm install

# Build shared package
npm run build:shared

# Start development (backend + frontend)
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3377
- **Network access**: http://YOUR_IP:5173

### Production

```bash
# Build everything
npm run build

# Start production server
NODE_ENV=production npm start
```

### Docker

```bash
cd docker
docker-compose up -d
# Access at http://YOUR_IP:3377
```

## 📁 Project Structure

```
/locsynq
├── apps/
│   ├── backend/         # Express + WebSocket + mDNS server
│   │   └── src/
│   │       ├── index.ts          # Entry point
│   │       ├── config.ts         # Configuration
│   │       ├── storage.ts        # Bucket & file storage
│   │       ├── websocket.ts      # WebSocket server
│   │       ├── discovery.ts      # mDNS discovery
│   │       ├── routes/           # API route handlers
│   │       └── middleware/       # Auth & validation
│   └── frontend/        # React + Vite + Tailwind SPA
│       └── src/
│           ├── pages/            # Discovery, Create, Viewer
│           ├── components/       # Header, FileCard, PinModal, etc.
│           ├── stores/           # Zustand state stores
│           └── services/         # API client & WebSocket
├── packages/
│   └── shared/          # Shared TypeScript types & constants
├── docker/              # Dockerfile + docker-compose.yml
└── package.json         # Root workspace config
```

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/bucket/create` | Create bucket |
| GET | `/api/bucket/list` | List all buckets |
| GET | `/api/bucket/:id` | Get bucket details |
| DELETE | `/api/bucket/:id` | Delete bucket (owner) |
| POST | `/api/bucket/:id/auth` | Authenticate with PIN |
| POST | `/api/bucket/:id/upload` | Upload files |
| GET | `/api/bucket/:id/files` | List files |
| GET | `/api/bucket/:id/files/:name` | Download file (streamed) |
| DELETE | `/api/bucket/:id/files/:name` | Delete file |
| POST | `/api/bucket/:id/text` | Add text note |
| POST | `/api/bucket/:id/link` | Add link |
| GET | `/api/bucket/:id/content` | List content |
| DELETE | `/api/bucket/:id/content/:id` | Delete content |
| GET | `/api/peers` | List discovered peers |
| WS | `/ws` | WebSocket real-time events |

## 🔐 Security

- PIN-based access control for protected buckets
- JWT session tokens with 24h expiry
- Path traversal prevention on file operations
- Input validation on all endpoints
- CORS configured for LAN access

## 📝 License

MIT
