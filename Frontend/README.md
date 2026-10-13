# 🌱 Carbon-Aware Workload Scheduler

A modern web application designed to optimize compute workloads based on grid carbon intensity. By intelligently scheduling tasks during low-carbon intensity windows across different cloud regions, the scheduler helps minimize the carbon footprint of data processing, AI training, and background computing jobs.

---

## ✨ Features

- 📊 **Interactive Dashboard**: Real-time overview of current grid carbon intensity, active scheduled workloads, and CO2 emissions saved.
- 📅 **Smart Workload Scheduling**: Schedule compute jobs with custom execution windows, duration, priority, and region preferences to run when clean energy availability is highest.
- 📈 **Carbon Intensity Forecast**: Visualize hourly carbon intensity trends and forecasts to pick optimal execution windows.
- 📋 **Job Management & History**: View detailed execution logs, status breakdown, and historic carbon savings per workload.
- ⚙️ **Settings & Customization**: Configure default cloud regions, carbon intensity thresholds, notification preferences, and API integrations.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linter**: [Oxlint](https://oxc.rs/)

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v18.0 or higher recommended)
- `npm` (comes bundled with Node.js) or `yarn` / `pnpm`

---

## 🚀 Run Guide (Getting Started)

Follow these steps to get the application up and running locally:

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Carbon-Aware-Scheduler
```

### 2. Install Dependencies
Install all required package dependencies:
```bash
npm install
```

### 3. Start Development Server
Launch the Vite development server with Hot Module Replacement (HMR):
```bash
npm run dev
```

Once started, open your browser and navigate to:
```
http://localhost:5173
```

### 4. Build for Production
To build the application for production deployment:
```bash
npm run build
```
The optimized production files will be output to the `dist/` directory.

### 5. Preview Production Build
To preview the production build locally before deployment:
```bash
npm run preview
```

### 6. Code Linting
To check for code linting errors using Oxlint:
```bash
npm run lint
```

---

## 📁 Project Structure

```
Carbon-Aware-Scheduler/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components (StatCard, Navbar, Sidebar, etc.)
│   ├── data/            # Mock dataset for carbon forecasts & job logs
│   ├── pages/           # Application pages (Dashboard, ScheduleWorkload, CarbonForecast, Jobs, History, Settings)
│   ├── utils/           # Utility functions & helpers
│   ├── App.jsx          # Main application component & routes
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global CSS design system & styles
├── index.html           # HTML template
├── package.json         # Project dependencies & scripts
└── vite.config.js       # Vite configuration
```

---

## 📄 License

This project is created for educational and research purposes as part of a Bachelor of Engineering (B.E.) Capstone Project.
