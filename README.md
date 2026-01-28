# Web App

React + Vite + TypeScript front-end application for user management.

## Features

- User registration with cloud provider selection (Azure, AWS, GCP)
- User login with JWT authentication
- User dashboard displaying profile information
- Built with React, TypeScript, TanStack Query, and Tailwind CSS

## Prerequisites

- Node.js (v18 or higher)
- Running user-api backend on http://localhost:3000

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## API Endpoints Used

- `POST /login` - User login
- `POST /users` - User registration
- `GET /me` - Get current user information (requires authentication)

## Environment

Make sure the user-api is running on port 3000 before starting the web application.
