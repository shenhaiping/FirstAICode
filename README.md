# Log Viewer (Minimal Stack)

Simple web app to display local `.log` files with minimal dependencies.

## Stack

- Backend: Node.js + Express
- Frontend: Plain HTML/CSS/JavaScript

## Quick Start

1. Install dependencies:

```bash
npm run install:all
```

2. Start server:

```bash
npm run dev
```

3. Open:

`http://localhost:3000`

## Configuration

Copy `.env.example` to `.env` and adjust if needed:

- `PORT`: server port
- `LOG_DIR`: local log directory path
- `DEFAULT_PAGE_SIZE`: default page size for API
- `MAX_PAGE_SIZE`: maximum page size for API

## API

`GET /api/logs`

Query params:

- `page` (default: `1`)
- `pageSize` (default: `50`)
- `level` (optional, e.g. `INFO`)
- `keyword` (optional, substring match)