# World IP Request Visualizer (WIRV)

A real-time web request visualization tool that displays global network activity on an interactive 3D globe.

## Project Structure

The project is organized into two main modules:

### Client Module (`wirv/client/`)
- **Technologies**:
  - Python 3.12
  - Click 8.1.8 (CLI interface)
  - HTTPX 0.28.1 (HTTP client)

### Server Module (`wirv/server/`)
- **Technologies**:
  - Flask 3.1.0 (Web framework)
  - Granian 2.2.3 (ASGI server)
  - Piccolo ORM with PostgreSQL
  - Three.js (3D visualization)
  - D3.js (Timeline visualization)
  - Bootstrap 5.3 (UI components)

## Directory Structure

```
wirv/
├── client/                # Client-side request generator
│   ├── __main__.py        # Entry point
│   ├── app.py             # Client application logic
│   └── dockerfile         # Client container configuration
├── core/                  # Shared core functionality
├── server/                # Server application
│   ├── app.py             # Server entry point
│   ├── controllers/       # API endpoints
│   ├── database/          # Database models and migrations
│   ├── static/            # Static assets (JS, CSS)
│   └── templates/         # HTML templates
```

## UI Components & Features

### 3D Globe Visualization
- Interactive 3D globe rendered with Three.js
- Real-time request visualization with glowing arcs
- Smooth camera controls:
  - Click and drag to rotate
  - Scroll to zoom in/out
  - Auto-rotation when idle
  - Double-click for auto-rotation

### Timeline Component
- Interactive timeline showing request history
- Features:
  - Draggable time window selection
  - Resizable time range
  - Visual density indicators
  - Real-time updates
  - Custom time range selection

### Playback Controls
- Multiple playback speed options:
  - x1 (real-time)
  - x5 (accelerated)
  - x100 (fast-forward)
  - x1000 (ultra-fast)
- Play/pause functionality
- Time window navigation

### Help System
- Interactive help tooltip
- Feature explanations
- Usage instructions

## Deployment Guide

### Prerequisites
- Python 3.12
- PostgreSQL
- Docker (optional)

### Create Env File
```.env
PG_USERNAME=<username>
PG_PASSWORD=<password>
PG_DATABASE=<database>
PG_HOSTNAME=<host>

PICCOLO_CONF=wirv.server.piccolo_conf
```

### Local Development Setup

1. Create and activate virtual environment:
```bash
uv sync --all-groups
```

2. Setup database:
```bash
uv run piccolo migrations forwards all
```

3. Start the server:
```bash
uv run granian --factory --interface wsgi wirv.server.app:factory --access-log
```

4. Access the application at `http://localhost:9321`

### Docker Deployment

1. Build and start services:
```bash
docker compose up -d
```

2. Access the application at `http://localhost:9321`

## Demo

You can explore the hosted version of the application at [https://wirv.inno.dartt0n.ru](https://wirv.inno.dartt0n.ru).

## License

This project is licensed under the MIT License - see the LICENSE file for details.