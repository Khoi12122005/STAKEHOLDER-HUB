# STAKEHOLDER-HUB (SCMH)

Stakeholder Hub is a comprehensive project management and meeting minute system with real-time notification capabilities.

## 🚀 Key Features

- **Project Dashboard:** Overview of project status and recent activities.
- **Meeting Management:** Create, update, and manage meetings with participants.
- **Meeting Minutes:** Record and generate minutes from meetings, including AI-assisted task extraction.
- **Kanban Board:** Manage tasks with a drag-and-drop interface.
- **Real-time Notifications:** Instant notifications for task assignments and meeting updates using Socket.io.
- **Audit Logs:** Track all critical actions within the system for transparency and accountability.

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **State Management:** React Hooks
- **Real-time:** Socket.io-client

### Backend
- **Runtime:** Node.js with TypeScript
- **Framework:** Express
- **ORM:** Prisma
- **Database:** MySQL
- **Real-time:** Socket.io
- **Authentication:** JWT (JSON Web Tokens)
- **AI Integration:** OpenAI API for meeting notes parsing

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Database

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Khoi12122005/STAKEHOLDER-HUB.git
   cd STAKEHOLDER-HUB
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Copy .env.example to .env and fill in your credentials
   cp .env.example .env
   # Generate Prisma client and run migrations
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   # Copy .env.example to .env.local and fill in the API URL
   cp .env.example .env.local
   npm run dev
   ```

## 🔧 Recent Improvements & Bug Fixes

- **Port Synchronization:** Standardized backend on port 5000 and frontend on port 3000 to resolve connection issues.
- **CORS Configuration:** Optimized cross-origin settings to allow secure communication between services.
- **Socket Authentication:** Fixed token retrieval logic to ensure real-time features are properly authenticated.
- **TypeScript Optimization:** Resolved compiler errors in `tsconfig.json` and standardized import/export patterns.
- **Stability:** Fixed "Failed to fetch" errors by aligning environment variables across the stack.

## 📄 License
[MIT License](LICENSE)
