# AlViz — Interactive Algorithm & Data Structure Visualizer

An interactive, high-performance web application mapping directly to the standard Computer Science curriculum. AlViz visualizes **20+ core algorithms and data structures** (including sorting, searching, graph traversals, and self-balancing trees) for datasets up to 1,000 elements with sub-millisecond precision.

---

## Key Features

- **HTML5 Canvas Animation Engine**: Custom high-DPI canvas renderer delivering smooth 60fps step-by-step animations that visually demystify abstract Big-O time and space complexities.
- **20+ Core Algorithms & Data Structures**:
  - **Sorting (8)**: Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, Quick Sort, Heap Sort, Counting Sort, Radix Sort
  - **Searching (2)**: Binary Search, Linear Search
  - **Graph Traversals & MST (5)**: Breadth-First Search (BFS), Depth-First Search (DFS), Dijkstra's Shortest Path, Prim's Minimum Spanning Tree, Kruskal's Minimum Spanning Tree
  - **Self-Balancing Trees & Structures (6)**: AVL Tree (with LL, RR, LR, RL rotation steps), Red-Black Tree, Stack, Queue, Singly Linked List, Hash Table (chaining collision resolution)
- **Comprehensive Playback Controls**:
  - Play / Pause toggling
  - Step Forward & Step Backward frame-by-frame stepping
  - Dynamic Speed Slider (1x to 10x with logarithmic tick delays)
  - Dataset Size Scaler (5 to 1,000 elements)
  - Preset options (Random, Nearly Sorted, Reverse Sorted)
  - Custom Data Input parser (comma/space-separated datasets up to 1,000 numbers)
- **Responsive Modern UI**:
  - Styled with Tailwind CSS, dark slate aesthetic (`#0f172a` palette)
  - Real-time Big-O time and space complexity badges
  - Live step counter, step description log, and progress bar
  - Mobile slide-out drawer navigation and responsive layout
- **Full-Stack REST Backend & Account System**:
  - **Node.js & Express.js** REST API with security middleware (Helmet, CORS, Morgan, Express Rate Limit)
  - **MongoDB & Mongoose** data layer for User accounts, Saved Datasets, and Simulation History
  - Stateless **JWT Authentication** (Bearer tokens) with bcrypt password hashing

---

## Architecture & Directory Structure

```
AlViz/
├── client/                     # Frontend static web application
│   ├── index.html              # Dedicated landing page (hero, catalog, features, CTA)
│   ├── visualizer.html         # Dedicated algorithm visualizer workspace route
│   ├── css/
│   │   └── styles.css          # Custom theme styles, animations, scrollbars
│   └── js/
│       ├── app.js              # Visualizer application orchestrator
│       ├── landing.js          # Landing page scripts & hero animations
│       ├── algorithms/
│       │   ├── sorting.js      # 8 sorting algorithm generators
│       │   ├── searching.js    # Binary & Linear search generators
│       │   ├── graph.js        # BFS, DFS, Dijkstra, Prim, Kruskal generators
│       │   └── trees.js        # AVL, Red-Black, Stack, Queue, LinkedList, Hash Table
│       ├── visualizer/
│       │   ├── canvas-renderer.js # Multi-mode Canvas 2D rendering pipeline
│       │   └── animator.js     # Discrete step playback engine
│       ├── ui/
│       │   ├── controls.js     # Playback and configuration control bindings
│       │   ├── auth.js         # Login, Register, Save Dataset modal manager
│       │   └── notifications.js# Toast notification system
│       └── utils/
│           ├── api.js          # REST client with JWT storage
│           └── dataGenerator.js# Random, nearly-sorted, reverse & graph data generators
├── server/                     # Backend API
│   ├── server.js               # Express application entrypoint
│   ├── package.json            # Backend dependencies
│   ├── .env.example            # Environment variable template
│   ├── config/
│   │   └── db.js               # Mongoose database connector
│   ├── middleware/
│   │   ├── auth.js             # JWT bearer verification middleware
│   │   └── errorHandler.js     # Centralized error handler
│   ├── models/
│   │   ├── User.js             # User model with bcrypt pre-save hash
│   │   ├── Dataset.js          # Saved datasets model
│   │   └── SimulationHistory.js# Simulation telemetry log model
│   └── routes/
│       ├── auth.js             # Register, Login, Me, Logout endpoints
│       ├── datasets.js         # CRUD for saved user datasets
│       └── history.js          # Simulation history endpoints
├── package.json                # Project root scripts
├── .gitignore
└── README.md
```

---

## Algorithm Complexity Matrix

| Category | Algorithm | Best Time | Average Time | Worst Time | Space |
|---|---|---|---|---|---|
| **Sorting** | Bubble Sort | $\Omega(n)$ | $\Theta(n^2)$ | $O(n^2)$ | $O(1)$ |
| **Sorting** | Selection Sort | $\Omega(n^2)$ | $\Theta(n^2)$ | $O(n^2)$ | $O(1)$ |
| **Sorting** | Insertion Sort | $\Omega(n)$ | $\Theta(n^2)$ | $O(n^2)$ | $O(1)$ |
| **Sorting** | Merge Sort | $\Omega(n \log n)$ | $\Theta(n \log n)$ | $O(n \log n)$ | $O(n)$ |
| **Sorting** | Quick Sort | $\Omega(n \log n)$ | $\Theta(n \log n)$ | $O(n^2)$ | $O(\log n)$ |
| **Sorting** | Heap Sort | $\Omega(n \log n)$ | $\Theta(n \log n)$ | $O(n \log n)$ | $O(1)$ |
| **Sorting** | Counting Sort | $\Omega(n+k)$ | $\Theta(n+k)$ | $O(n+k)$ | $O(k)$ |
| **Sorting** | Radix Sort | $\Omega(d(n+k))$ | $\Theta(d(n+k))$ | $O(d(n+k))$ | $O(n+k)$ |
| **Searching** | Linear Search | $\Omega(1)$ | $\Theta(n)$ | $O(n)$ | $O(1)$ |
| **Searching** | Binary Search | $\Omega(1)$ | $\Theta(\log n)$ | $O(\log n)$ | $O(1)$ |
| **Graph** | BFS | $\Omega(V+E)$ | $\Theta(V+E)$ | $O(V+E)$ | $O(V)$ |
| **Graph** | DFS | $\Omega(V+E)$ | $\Theta(V+E)$ | $O(V+E)$ | $O(V)$ |
| **Graph** | Dijkstra | $\Omega((V+E)\log V)$ | $\Theta((V+E)\log V)$ | $O((V+E)\log V)$ | $O(V)$ |
| **Graph** | Prim's MST | $\Omega((V+E)\log V)$ | $\Theta((V+E)\log V)$ | $O((V+E)\log V)$ | $O(V)$ |
| **Graph** | Kruskal's MST | $\Omega(E \log E)$ | $\Theta(E \log E)$ | $O(E \log E)$ | $O(V)$ |
| **Tree** | AVL Tree (Search/Insert) | $\Omega(\log n)$ | $\Theta(\log n)$ | $O(\log n)$ | $O(1)$ |
| **Tree** | Red-Black Tree (Search/Insert) | $\Omega(\log n)$ | $\Theta(\log n)$ | $O(\log n)$ | $O(1)$ |
| **DS** | Stack (Push/Pop) | $O(1)$ | $O(1)$ | $O(1)$ | $O(n)$ |
| **DS** | Queue (Enqueue/Dequeue) | $O(1)$ | $O(1)$ | $O(1)$ | $O(n)$ |
| **DS** | Linked List (Insert/Search) | $O(1) \text{ ins}$ | $O(n) \text{ search}$ | $O(n) \text{ search}$ | $O(n)$ |
| **DS** | Hash Table (Get/Set) | $O(1)$ | $O(1)$ | $O(n)$ | $O(n)$ |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0.0 or later)
- [MongoDB](https://www.mongodb.com/) (optional, required only for persistence/accounts)

### 1. Installation
Clone the repository and install dependencies:
```bash
# Install backend dependencies
cd server
npm install
```

### 2. Environment Configuration
Copy `.env.example` in `server/` to `.env`:
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/alviz
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Running the Server
```bash
cd server
npm start
# Server listens on http://localhost:5000
```

### 4. Running the Frontend
The client is a zero-build vanilla ES6 application. You can serve it with any static server:
```bash
# Option A: Using npx serve or python
cd client
npx serve -p 3000

# Option B: Or open client/index.html directly in a browser
```

---

## REST API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account (`username`, `email`, `password`) |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive JWT bearer token |
| `GET` | `/api/auth/me` | Protected | Fetch authenticated user profile |
| `POST` | `/api/auth/logout` | Protected | Logout session |
| `GET` | `/api/datasets` | Protected | List all custom datasets belonging to user |
| `POST` | `/api/datasets` | Protected | Create and save a custom dataset |
| `GET` | `/api/datasets/public` | Public | List all public community datasets |
| `GET` | `/api/datasets/:id` | Mixed | Fetch specific dataset by ID |
| `PUT` | `/api/datasets/:id` | Protected | Update custom dataset |
| `DELETE` | `/api/datasets/:id` | Protected | Delete custom dataset |
| `GET` | `/api/history` | Protected | Paginated simulation run history (`?page=1&limit=20`) |
| `POST` | `/api/history` | Protected | Log a completed simulation run |
| `DELETE` | `/api/history` | Protected | Clear user simulation telemetry |

---

## License
MIT © 2024 AlViz Team.
