<div align="center">
  <h1>🚀 DSA Tracker</h1>
  <p>A full-stack application to track your Data Structures and Algorithms progress.</p>
</div>

## 📖 Overview

DSA Tracker is a comprehensive tool designed to help developers monitor and manage their Data Structures and Algorithms practice. Whether you are preparing for coding interviews or just honing your problem-solving skills, this application allows you to track questions, save filters, and visualize your progress effectively.

## ✨ Features

- **User Authentication**: Secure sign-up and login using JWT.
- **Problem Tracking**: Log and manage DSA questions you've tackled.
- **Custom Filters**: Save your preferred filters (e.g., difficulty, topic) for quick access.
- **Progress Visualization**: Intuitive dashboard to see your performance metrics.
- **Responsive Design**: Modern and sleek UI accessible on both desktop and mobile devices.

## 🛠️ Tech Stack

**Frontend:**
- [React](https://reactjs.org/) (v18)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/) & [Framer Motion](https://www.framer.com/motion/)

**Backend:**
- [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas/database) & [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/) for Authentication

## 📂 Project Structure

```bash
├── backend/                # Express & Node.js backend
│   ├── models/             # Mongoose schemas (User, Question, SavedFilter)
│   ├── routes/             # API endpoints
│   ├── controllers/        # Request handling logic
│   ├── .env.example        # Example environment variables
│   └── server.js           # Entry point
├── src/                    # React frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/              # Application views
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API interaction layer
│   ├── index.css           # Global Tailwind styles
│   └── App.tsx             # Main application component
├── package.json            # Frontend dependencies
└── vite.config.ts          # Vite configuration
```

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20 or higher)
- [npm](https://www.npmjs.com/) (v10 or higher)
- A [MongoDB Atlas](https://www.mongodb.com/atlas/database) account and cluster.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd DSA
   ```

2. **Setup Backend:**
   Navigate to the backend directory, install dependencies, and configure environment variables.
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   *Open the `.env` file and fill in your `MONGODB_URI` and `JWT_SECRET`.*

3. **Setup Frontend:**
   Open a new terminal, navigate to the root directory, and install dependencies.
   ```bash
   npm install
   ```

### Running the Application

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```
   *The backend will run on `http://localhost:5000`.*

2. **Start the Frontend Development Server:**
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`.*

## 🔒 Environment Variables

**Backend (`backend/.env`):**
- `PORT` - Port for the backend server (default: 5000)
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT authentication
- `JWT_EXPIRES_IN` - Token expiration time (e.g., `7d`)
- `CLIENT_URL` - Allowed CORS origin (e.g., `http://localhost:5173`)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.