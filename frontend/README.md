# Frontend - Fraud Detection Dashboard

Next.js-based dashboard for the MLOps Fraud Detection system.

## Overview

This is the web interface for monitoring and managing fraud detection operations. It provides real-time visualization of transactions, client data, and fraud predictions.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + Shadcn
- **HTTP Client**: Axios

## Features

- 🔐 Authentication (Login/Register)
- 📊 Real-time transaction monitoring
- 👥 Client management dashboard
- 🎯 Fraud prediction visualization
- 📈 Analytics and statistics

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Docker

```bash
# Build image
docker build -t fraud-detection-frontend .

# Run container
docker run -p 3000:3000 fraud-detection-frontend
```

## Project Structure

```
frontend/
├── app/              # Next.js App Router pages
│   ├── api/         # API routes (server-side)
│   ├── auth/        # Authentication pages
│   ├── clients/     # Client management
│   └── transactions/# Transaction monitoring
├── components/       # React components
│   └── ui/          # Shadcn UI components
├── lib/             # Utilities and helpers
└── types/           # TypeScript type definitions
```

## API Integration

The frontend communicates with the FastAPI backend at the URL specified in `NEXT_PUBLIC_API_URL`.

Main API endpoints:
- `/api/auth/*` - Authentication
- `/api/clients/*` - Client data
- `/api/transactions/*` - Transaction data
- `/api/predictions/*` - Fraud predictions
