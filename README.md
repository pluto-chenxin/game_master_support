# Game Master Support

A comprehensive application for managing games, puzzles, hints, and maintenance records.

## Features

- **Game Management**: Track your game collection with detailed information
- **Puzzle Tracking**: Organize puzzles within each game and track their status
- **Hint System**: Keep track of hints for each puzzle, including premium hints
- **Maintenance Records**: Log maintenance activities for puzzles that need fixes
- **Dashboard**: Get an overview of your games and progress

## Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- Prisma ORM

### Frontend
- React
- Ant Design
- Axios for API calls
- React Router for navigation

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd game-master-support
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Set up environment variables
- Copy the `.env.example` file to `.env`
- Update the `DATABASE_URL` with your PostgreSQL connection string

4. Initialize the database
```bash
npx prisma migrate dev --name init
```

5. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server
```bash
cd backend
npm run dev
```

2. Start the frontend development server
```bash
cd frontend
npm start
```

3. Access the application at `http://localhost:3000`

## Usage

1. **Dashboard**: View statistics about your games, puzzles, and hints
2. **Game Management**: Add, edit, and delete games in your collection
3. **Puzzle Tracking**: Create puzzles within games and track their completion status
4. **Hint System**: Add hints to help solve difficult puzzles
5. **Maintenance Records**: Track maintenance tasks for puzzles that need fixes

## License

This project is licensed under the MIT License - see the LICENSE file for details. 