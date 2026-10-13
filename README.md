# Carbon-Aware Serverless Scheduler

A web-based project that schedules serverless workloads based on carbon intensity forecasts to help reduce the environmental impact of cloud computing.

## Features

- Dashboard to monitor workloads.
- Schedule workloads with runtime and deadline constraints.
- View job status and scheduling history.
- Visualize carbon intensity forecasts.
- Integrate carbon data through the WattTime service.

## Technology Stack

**Frontend**
- React
- Vite
- JavaScript and CSS

**Backend**
- Python
- Flask
- REST API

**Carbon Data**
- WattTime API

## Prerequisites

Install the following before running the project:

- Python 3
- Node.js and npm
- Git

## Project Structure

```text
Carbon-Aware-Scheduler/
├── Backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── routes/
│   ├── services/
│   └── data/
├── Frontend/
│   ├── package.json
│   ├── src/
│   └── public/
├── .gitignore
└── README.md
```

## How to Run the Project

### 1. Clone the repository

```bash
git clone https://github.com/Mansi-Mahanor/carbonaware-serverless-scheduler.git
cd carbonaware-serverless-scheduler
```

### 2. Start the backend

Open a terminal in the project folder:

```bash
cd Backend
pip install -r requirements.txt
python app.py
```

Keep this terminal running.

### 3. Start the frontend

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open the local URL displayed in the terminal, usually `http://localhost:5173`.

## Environment Configuration

Some features may require WattTime API credentials. Configure the required environment variables locally using the names expected by the backend code.

Never commit `.env` files, passwords, API tokens, or other secret credentials to GitHub.

## Important Notes

- Run the backend and frontend in separate terminals.
- Keep both development servers running while testing.
- Ensure the frontend API configuration points to the correct backend address.
- WattTime functionality requires valid credentials and API access.

## Contributors

Developed as an academic project on carbon-aware workload scheduling.
