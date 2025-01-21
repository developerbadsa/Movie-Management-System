# Movie Management System

## System Overview
This project provides a secure, user-friendly movie management system with user authentication, movie ratings, and admin functionalities for report management. The platform ensures role-based access for users and admins, supporting key operations like creating, viewing, updating, rating, and reporting movies.

## Live Links
- **API Testing Frontend**: [API Testing App](https://api-test-and-management-app.vercel.app/)
- **Backend API Server**: [Movie Management API](https://movie-management-system-production-3733.up.railway.app/)

---

## Features

### User Authentication
- **Register**: Create new users with roles (`USER` or `ADMIN`).
- **Login**: Authenticate users via email and password.
- **JWT-Based Authorization**: Protect endpoints with role-based access.

### Movie Management
- **View Movies**: Authenticated users can view a list of all movies and detailed information, including:
  - Description
  - Release date
  - Duration
  - Genre
  - Created by
  - Average rating
  - Total ratings
  - Language
- **Create Movies**: Authenticated users can add new movies.
- **Update Movies**: Only the creator can update their movies.

### Rating System
- Users can rate movies (1 to 5).
- Update existing ratings.
- Automatically calculate and display average ratings without modifying the `updated_at` field.

### Admin Controls
- **View Reports**: Admins can view all movie reports.
- **Resolve Reports**: Approve or reject movie reports.

---

## API Endpoints

Easily you can test all api with this [API Testing App](https://api-test-and-management-app.vercel.app/)

### Authentication
- **POST** `/register`: Register a new user.
- **POST** `/login`: Login and retrieve a JWT token.

### Movies
- **GET** `/movies`: View all movies (authentication required).
- **POST** `/movies`: Create a movie (authentication required).
- **PUT** `/movies/:id`: Update a movie (creator-only).
- **POST** `/movies/:id/rate`: Rate or update rating for a movie.

### Reports
- **POST** `/movies/:id/report`: Report a movie (authentication required).
- **GET** `/admin/reports`: View all reports (admin-only).
- **POST** `/admin/reports/:id/resolve`: Approve or reject a report (admin-only).

### Testing Endpoint
- **GET** `/test`: Test the server connection.

---

## Testing Workflow

### Users
1. **Register Users**: Create two regular users and one admin.
2. **Login**: Authenticate users and admin to obtain tokens.

### Movie Management
1. **Create Movies**: Each user creates two movies.
2. **View Movies**: Verify movie details and ratings are displayed correctly.

### Ratings
1. Rate all movies created by users.
2. Update ratings and verify average rating calculation.

### Reports
1. Report a movie as a user.
2. Admin resolves reports by approving or rejecting.

---

## Development Details

### Tech Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT for secure access

### Setup Instructions
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```env
   JWT_SECRET=your_secret_key
   DATABASE_URL=your_database_url
   ```
4. Run the application:
   ```bash
   npm start
   ```