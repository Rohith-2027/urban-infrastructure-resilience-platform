# Urban Infrastructure Resilience Platform

**Urban Infrastructure Failure Chain Simulator for Smart Cities**

---

## 1. Project Overview

### Purpose

The Urban Infrastructure Resilience Platform is a simulation system designed to model, analyze, and visualize cascading failure chains across interconnected urban infrastructure networks. Built as a geospatial intelligence platform, it enables city planners, emergency responders, and resilience engineers to understand how a single infrastructure failure can propagate through dependent systems.

### Problem Statement

Modern cities depend on deeply interconnected infrastructure systems — power grids, water networks, communication systems, healthcare facilities, emergency services, and transportation networks. When one system fails, the effects cascade through dependency chains: a power substation failure can disable water pumps, disrupt communication towers, and compromise hospital operations simultaneously. Traditional infrastructure management treats these systems in isolation, leaving cities vulnerable to catastrophic multi-system failures.

### Objectives

- Map real-world infrastructure dependencies using OpenStreetMap data
- Model consumer-provider relationships across infrastructure types
- Visualize dependency chains as an interactive graph overlay on GIS maps
- Simulate failure propagation through interconnected systems
- Enable data-driven resilience planning for urban environments

### Why Infrastructure Dependency Simulation is Important

Infrastructure dependencies are often invisible until a failure occurs. Hurricane Maria (2017) demonstrated how power grid failures cascaded into water, communication, and healthcare crises across Puerto Rico. The 2021 Texas power crisis showed how energy failures cascade into water system failures and healthcare system overload. This platform makes these hidden dependency chains visible and simulatable before disasters strike.

### Scope of Current Implementation

The current implementation covers the foundation layers: GIS map rendering with MapLibre, real-time OpenStreetMap data fetching, infrastructure layer visualization, and a complete dependency graph engine that models real-world infrastructure relationships. The platform is now ready for the Failure Simulation Engine — the core simulation capability.

---

## 2. Features Implemented

### GIS Platform

- [x] MapLibre GL Integration
- [x] React Map GL Wrapper
- [x] Interactive Pan, Zoom, Rotate
- [x] Coordinate Display
- [x] Compass Control
- [x] Home Reset Control
- [x] Scale Control
- [x] Camera Animation Service

### Study Area

- [x] GeoJSON Study Area Boundary
- [x] Area-based Data Fetching
- [x] Spatial Filtering

### OpenStreetMap Integration

- [x] Overpass API Service
- [x] Real-time Infrastructure Data Fetching
- [x] Road Network Fetching
- [x] Infrastructure Metadata Extraction
- [x] MongoDB Caching Layer

### Infrastructure Layers

- [x] Roads
- [x] Hospitals
- [x] Fire Stations
- [x] Police Stations
- [x] Power Substations
- [x] Water Infrastructure
- [x] Communication Infrastructure
- [x] Education
- [x] Traffic Management

### Layer Manager

- [x] Layer Toggle Control
- [x] Layer Visibility State
- [x] Layer Registry System
- [x] Layer Color Configuration

### Search

- [x] Infrastructure Search Control
- [x] Search Result Markers
- [x] Search Popup Display

### Dependency Graph Engine

- [x] Consumer-centric Dependency Generation
- [x] Primary / Backup Provider Assignment
- [x] Nearest Neighbor Resolution
- [x] One-to-Many Fan-out
- [x] Edge Type Classification (Power, Fiber, Water, Road, Emergency, Medical)
- [x] Graph Validation Engine
- [x] Unique Node ID Generation

### Dependency Visualization

- [x] Dependency Edge Rendering on Map
- [x] Edge Color Coding by Type
- [x] Layer Filtering for Dependencies
- [x] Edge Highlighting on Hover
- [x] Node Highlighting on Selection
- [x] Connected Node Highlighting
- [x] Dependency Legend
- [x] Edge Tooltip Display

### Dependency Drawer

- [x] Infrastructure Detail Drawer
- [x] Dependency Chain Display
- [x] Provider/Consumer Relationship Display
- [x] Infrastructure Metadata Display
- [x] Status Indicators

### Supports Drawer

- [x] Backup Provider Display
- [x] Primary Provider Display
- [x] Dependency Type Indicators

### Metadata Synchronization

- [x] Infrastructure Metadata JSON
- [x] Backend Metadata Config
- [x] Frontend Metadata Helpers
- [x] Cache Invalidation on Metadata Update

### Manual Infrastructure Integration

- [x] Manual Power Substations (GeoJSON)
- [x] Manual Infrastructure Data Source
- [x] Fallback Name Resolution

### Graph Caching

- [x] Backend Dependency Graph Cache
- [x] Graph Validation on Cache Load
- [x] Cache TTL Management

### Infrastructure Caching

- [x] MongoDB Infrastructure Cache
- [x] Cache Warmup Script
- [x] Cache Audit Script
- [x] Cache Cleanup Script

### Unique Node IDs

- [x] Prefix-based ID Generation
- [x] Duplicate Detection
- [x] ID Collision Prevention

### Stable Dependency Graph

- [x] Consistent Edge Generation
- [x] Deterministic Provider Assignment
- [x] Validated Graph Structure

---

## 3. Current Dependency Rules

| Infrastructure Type | Depends On |
|---|---|
| **Hospital** | Power, Water, Communication |
| **Fire Station** | Power, Water, Communication |
| **Police Station** | Power, Water, Communication |
| **Education** | Power, Water |
| **Communication** | Power |
| **Water Infrastructure** | Power |
| **Traffic Management** | Power, Communication |
| **Power Substations** | Provider (independent) |
| **Roads** | Independent transportation layer |

---

## 4. Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  MapLibre GL  │  Layer Manager  │  Dependency Graph UI   │
│  Search       │  Controls       │  Detail Drawer         │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (REST API)
┌──────────────────────▼──────────────────────────────────┐
│                  Express API (Backend)                    │
│  /api/infrastructure  │  /api/dependency                 │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 Dependency Engine                         │
│  dependencyTypes.js  │  dependencyGraph.js               │
│  dependencyService.js │  Graph Validation                │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Infrastructure Service                       │
│  Overpass API  │  Cache Service  │  Metadata              │
└──────────┬───────────────┬──────────────────────────────┘
           │               │
┌──────────▼──────┐ ┌──────▼──────────────────────────────┐
│   MongoDB       │ │    OpenStreetMap + Manual Data       │
│  (Cache Layer)  │ │    (External Data Sources)           │
└─────────────────┘ └─────────────────────────────────────┘
```

---

## 5. Folder Structure

```
Urban-Infrastructure-Resilience-Platform/
│
├── frontend/                         # React frontend application
│   ├── public/                       # Static assets (favicon, icons)
│   ├── src/
│   │   ├── main.jsx                  # Application entry point
│   │   ├── App.jsx                   # Root component
│   │   ├── index.css                 # Global styles (Tailwind)
│   │   ├── config/                   # API configuration
│   │   ├── routes/                   # Client-side routing
│   │   ├── layouts/                  # Page layouts
│   │   ├── pages/                    # Route pages
│   │   ├── data/                     # Static data (study area GeoJSON)
│   │   ├── infrastructure/           # Infrastructure layer management
│   │   │   ├── hooks/                # Infrastructure React hooks
│   │   │   └── services/             # Infrastructure API services
│   │   └── gis/                      # Core GIS module
│   │       ├── components/           # Map UI components (13 components)
│   │       ├── config/               # Map and layer configuration
│   │       ├── constants/            # Map constants
│   │       ├── dependency/           # Dependency graph frontend logic
│   │       ├── hooks/                # Map, camera, layer hooks
│   │       ├── layers/               # Dependency layer rendering
│   │       ├── services/             # Camera, animation, layer services
│   │       ├── styles/               # Map CSS styles
│   │       └── utils/                # GeoJSON and infrastructure utilities
│   ├── package.json                  # Frontend dependencies
│   └── vite.config.js               # Vite build configuration
│
├── backend/                          # Express backend application
│   ├── src/
│   │   ├── server.js                 # Server entry point
│   │   ├── app.js                    # Express app setup
│   │   ├── config/                   # Environment and MongoDB configuration
│   │   ├── constants/                # Cache and Overpass API constants
│   │   ├── controllers/              # Route handlers
│   │   ├── dependency/               # Dependency graph engine
│   │   │   ├── dependencyTypes.js    # Edge types and strategies
│   │   │   ├── dependencyService.js  # Dependency resolution service
│   │   │   └── dependencyGraph.js    # Graph construction and validation
│   │   ├── middleware/               # Express middleware (planned)
│   │   ├── models/                   # Mongoose schemas
│   │   ├── routes/                   # API route definitions
│   │   ├── scripts/                  # Utility and maintenance scripts
│   │   ├── services/                 # Business logic services
│   │   └── utils/                    # Utility functions
│   ├── config/                       # Infrastructure metadata JSON
│   ├── data/                         # Manual infrastructure GeoJSON data
│   ├── .env                          # Environment variables (local)
│   ├── .env.example                  # Environment variables template
│   └── package.json                  # Backend dependencies
│
├── docs/                             # Documentation (planned)
│
└── README.md                         # Project documentation
```

---

## 6. Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 8 | Build tool and dev server |
| Tailwind CSS 4 | Utility-first styling |
| MapLibre GL 5 | Interactive map rendering |
| React Map GL 8 | React wrapper for MapLibre |
| Lucide React | Icon library |
| Axios | HTTP client |
| React Router DOM 7 | Client-side routing |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express 5 | Web framework |
| Mongoose 9 | MongoDB ODM |
| Axios | HTTP client (Overpass API) |
| Dotenv | Environment variable management |

### Database

| Technology | Purpose |
|---|---|
| MongoDB | Infrastructure data caching |

### GIS

| Technology | Purpose |
|---|---|
| MapLibre GL | Map rendering engine |
| Overpass API | OpenStreetMap data source |
| GeoJSON | Spatial data format |

### Libraries

| Library | Purpose |
|---|---|
| MapLibre GL JS | Vector tile map rendering |
| OpenStreetMap | Infrastructure data source |
| Overpass Turbo | Spatial query engine |

---

## 7. Installation Guide

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or accessible via URI
- Git

### Clone Repository

```bash
git clone https://github.com/Rohith-2027/urban-infrastructure-resilience-platform.git
cd urban-infrastructure-resilience-platform
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Start the backend server:

```bash
npm run dev
```

The backend will start on `http://localhost:5000`.

### Frontend Setup

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` and proxy API requests to the backend.

---

## 8. Environment Variables

Create a `.env` file in the `backend/` directory using the provided template:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/urban_infrastructure_resilience` |

Example `.env` file:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/urban_infrastructure_resilience
```

All three variables are **required**. The server will fail to start if any are missing.

---

## 9. Required Dependencies

Dependencies install automatically when you run `npm install` in the respective directories.

### Backend Packages

| Package | Version | Purpose |
|---|---|---|
| express | ^5.1.0 | Web framework |
| mongoose | ^9.7.4 | MongoDB ODM |
| axios | ^1.15.2 | HTTP client for Overpass API |
| dotenv | ^17.4.2 | Environment variable loading |

### Frontend Packages

| Package | Version | Purpose |
|---|---|---|
| react | ^19.2.7 | UI framework |
| react-dom | ^19.2.7 | React DOM renderer |
| react-router-dom | ^7.18.1 | Client-side routing |
| maplibre-gl | ^5.24.0 | Map rendering engine |
| react-map-gl | ^8.1.1 | React MapLibre wrapper |
| axios | ^1.18.1 | HTTP client |
| lucide-react | ^1.25.0 | Icon library |
| tailwindcss | ^4.3.3 | Utility CSS framework |
| @tailwindcss/vite | ^4.3.3 | Tailwind Vite plugin |
| vite | ^8.1.1 | Build tool (devDependency) |

---

## 10. Current Project Status

| Module | Status |
|---|---|
| **Dependency Graph Module** | **COMPLETED** |
| **Current Version** | **v1.0** |
| **Ready For** | **Failure Simulation Engine** |

### Completed Milestones

- Phase 1: GIS Platform with MapLibre integration
- Phase 2: Infrastructure data fetching and caching
- Phase 3: Dependency graph engine with validation
- Phase 4: Dependency visualization and interaction

### Next Milestone

The Failure Simulation Engine is the next critical module. It will use the validated dependency graph to simulate cascading failures across infrastructure networks.

---

## 11. Development Roadmap

| Phase | Module | Status |
|---|---|---|
| Phase 1 | GIS Platform | Completed |
| Phase 2 | Infrastructure Integration | Completed |
| Phase 3 | Dependency Graph | Completed |
| Phase 4 | Failure Simulation Engine | Pending |
| Phase 5 | Failure Propagation Engine | Pending |
| Phase 6 | Recovery Simulation | Pending |
| Phase 7 | Analytics Dashboard | Pending |
| Phase 8 | Risk Assessment | Pending |
| Phase 9 | Reports & Export | Pending |
| Phase 10 | Testing & Optimization | Pending |

---

## 12. Contributors

| Role | Name | Details |
|---|---|---|
| **Project Team** | Urban Infrastructure Resilience Research Group | Development and implementation |
| **Institute** | Academic Research Institution | Research and development |
| **Supervisor** | Project Supervisor | Guidance and oversight |

---

## 13. License

This is an **educational project** developed for academic research and learning purposes.

---

*Built for smart city resilience — making invisible infrastructure dependencies visible.*
