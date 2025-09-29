# Task Management Application

A comprehensive task management application with Kanban boards, real-time updates, and collaborative features. This full-stack application allows teams to manage projects, tasks, and collaborate in real-time.

![Task Management App Screenshot](https://via.placeholder.com/800x450.png?text=Task+Management+App)

## Features

### Core Features
- **Authentication** 
  - Sign up/login with email and password
  - OAuth integration (Google/GitHub)
  - JWT-based authentication
  - Password reset functionality

- **Projects** 
  - Create multiple projects
  - Invite team members
  - Role-based permissions (owner, admin, member)
  - Project activity tracking

- **Kanban Board** 
  - Customizable columns
  - Drag-and-drop interface
  - Real-time updates
  - Board sharing and collaboration

- **Task Management** 
  - Create, edit, and delete tasks
  - Assign users to tasks
  - Set due dates and priorities
  - Add labels and attachments
  - Track task status

- **Comments & Activity Log** 
  - Comment on tasks
  - @mention team members
  - Track all changes and updates
  - Activity timeline

- **Notifications** 
  - Real-time notifications via WebSockets
  - Email notifications (optional)
  - Notification center
  - Custom notification preferences

### Bonus Features
- **Mobile-Friendly UI** - Responsive design works on all devices
- **Role-Based Permissions** - Different access levels for team members
- **Export Functionality** - Export boards to PDF/Excel (coming soon)
- **Calendar Integration** - View tasks in calendar format (coming soon)

## Tech Stack

### Frontend
- **React 18** with Vite for fast development and optimized builds
- **TailwindCSS** for responsive and customizable UI
- **@hello-pangea/dnd** for smooth drag-and-drop functionality
- **Zustand** for state management
- **React Router** for navigation
- **React Hook Form** for form handling and validation
- **Axios** for API requests
- **Socket.IO Client** for real-time communication

### Backend
- **Node.js** with Express.js for a robust API
- **MongoDB** with Mongoose for flexible data storage
- **Socket.IO** for real-time updates and notifications
- **JWT** and Passport.js for authentication
- **bcrypt** for password hashing
- **Express Validator** for input validation

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Git

### Local Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd task-management
```

2. **Set up environment variables**

For the backend:
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

For the frontend:
```bash
cd frontend
cp .env.example .env
# Edit .env with your configuration
```

3. **Install dependencies**

Backend:
```bash
cd backend
npm install
```

Frontend:
```bash
cd frontend
npm install
```

4. **Start the development servers**

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Docker Setup

We provide Docker support for easy deployment:

1. **Build and run with Docker Compose**
```bash
docker-compose up -d
```

This will:
- Start MongoDB container
- Build and start the backend API
- Build and start the frontend application
- Configure networking between services

2. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
task-management/
├── backend/                # Backend API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── socket/         # Socket.IO handlers
│   │   └── index.js        # Entry point
│   ├── .env.example        # Example environment variables
│   └── package.json        # Backend dependencies
│
├── frontend/               # React frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── layouts/        # Layout components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Zustand stores
│   │   ├── styles/         # CSS styles
│   │   ├── utils/          # Utility functions
│   │   ├── App.jsx         # Main App component
│   │   └── main.jsx        # Entry point
│   ├── .env.example        # Example environment variables
│   └── package.json        # Frontend dependencies
│
├── docker-compose.yml      # Docker Compose configuration
├── .gitignore              # Git ignore file
└── README.md               # Project documentation
```

## API Documentation

The API documentation is available at `/api-docs` when running the backend server.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Socket.IO](https://socket.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [Hello Pangea DnD](https://github.com/hello-pangea/dnd)
# Task-Management
