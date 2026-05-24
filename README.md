# 🏠 Hostel Management System

## Group Information

|-------------------|-----------------------------------------------------------|
|       Field       |                          Details                          |
|-------------------|-----------------------------------------------------------|
| **Group Number**  | 27 *(Estimated — project proposal not submitted on time)* |
| **Project Title** | Hostel Management System                                  |
|     **Course**    | Database Systems (CS2005 & CL2005) — Spring 2026          |
|     **Section**   | CS-4A                                                     |
|-------------------|-----------------------------------------------------------|

---

## Group Members

|---------------------|-------------|
|        Name         | Roll Number | 
|---------------------|-------------|
|     Yasir Ali       |   24P-0694  |
| Sardar Umair Nawaz  |   24P-0590  |
|---------------------|-------------|

---

## Project Description

It is a modern full-stack Hostel Management System developed to computerize and simplify the core operations of hostel management. The system is designed for educational institutions, universities, and private hostel organizations that manage one or multiple hostels simultaneously.

The project provides a centralized admin dashboard for managing:

- Hostels
- Rooms
- Students
- Staff
- Room Allocations
- Fee Payments
- Wardens

The system supports both:
- Single hostel environments
- Multi-hostel organizations

This makes Hostel management system is scalable, flexible, and suitable for real-world hostel management operations.

---

# Main Features

## Multi-Hostel Management
- Manage multiple hostels from one centralized system
- Hostel-wise filtering and analytics
- Independent room and student management per hostel

## Hostel Management
- Add, update, delete, and view hostel details
- Warden assignment system
- Dynamic hostel statistics
- Hostel occupancy tracking

## Room Management
- Add and manage hostel rooms
- Room type management
- Occupancy and availability tracking
- Dynamic room filtering and searching

## Student Management
- Add/update student records
- Hostel and room allocation support
- Student search and filtering
- Guardian information support

## Staff Management
- Manage hostel staff records
- Hostel-wise staff organization
- Dynamic staff rendering

## Allocation System
- Allocate students to rooms
- Track occupied and available beds
- Automatic occupancy updates

## Fee Payment Management
- Track hostel fee payments
- Payment status management
- Payment records and statistics

## Dashboard Analytics
- Real-time hostel statistics
- Occupancy analytics
- Hostel-wise dashboard filtering
- Dynamic dashboard

---

# Technologies Used

## Frontend Technologies
- HTML5
- CSS3
- JavaScript (ES6)

## Backend Technologies
- Node.js
- Express.js

## Database Technologies
- MySQL
- AWS RDS (Amazon Relational Database Service)

## Security Features
- SQL Injection Prevention
- Parameterized Queries
- Input Sanitization
- Backend Validation
- Frontend Validation
- Secure CRUD Operations

## API & Architecture
- RESTful APIs
- MVC Architecture
- Modular Backend Structure
- Async/Await Programming

## UI/UX Technologies
- Responsive Web Design
- CSS Animations
- Hover Effects
- Interactive Components

## Development Tools
- Git
- GitHub
- VS Code
- Nodemon
- dotenv
- mysql2
- npm

## Cloud & Deployment Technologies
- AWS Cloud Database
- Remote Database Connectivity

---

## GitHub Repository

> 🔗 **Repository URL:** `https://github.com/Umair-Nawaz0/hostel_project`

---

# How to Run the Application

## 1. Download the Repository
Download or clone the repository from the GitHub link provided above.

```bash
git clone https://github.com/Umair-Nawaz0/hostel_project


## 2. Create MySQL Database

Open MySQL and create a new database.

Example:

```sql
CREATE DATABASE hostel_management;
```

After creating the database, import/run the SQL queries provided inside the database folder.

---

## 3. Open Backend Folder

Open terminal and move to the backend directory.

```bash
cd backend
```

---

## 4. Install Dependencies

Install all required Node.js packages.

```bash
npm install
```

---

## 5. Create `.env` File

Inside the backend folder, create a `.env` file and add your database configuration.

Example:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hostel_management
DB_PORT=3306
PORT=5000
```

---

## 6. Run Backend Server

Start the backend server using:

```bash
npm run dev
```

If everything is configured correctly, the server will start successfully.

---

## 7. Open Frontend

Open the frontend HTML files in your browser.

Example:

- `login.html`
- `dashboard.html`

Now the application should work properly.

---
