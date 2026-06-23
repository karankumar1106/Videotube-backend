# 🎥 VideoTube Backend API

A production-style backend inspired by YouTube, built with **Node.js**, **Express.js**, **MongoDB**, and **Mongoose**.

This project provides a complete backend system for video sharing platforms, including authentication, video management, subscriptions, playlists, comments, likes, watch history, tweets, and dashboard analytics.

---

## 🚀 Features

* JWT Authentication & Authorization
* Access & Refresh Token Flow
* Secure Cookie-Based Authentication
* User Profile Management
* Avatar & Cover Image Uploads
* Video Upload & Management
* Comments System
* Like / Unlike Functionality
* Playlist Management
* Channel Subscriptions
* Watch History Tracking
* Cloudinary Media Storage
* MongoDB Aggregation Pipelines
* Pagination & Filtering
* Custom Error Handling

---

## 🛠 Tech Stack

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Authentication

* JWT

### Media Handling

* Multer
* Cloudinary

### Utilities

* Cookie Parser
* CORS
* dotenv

---

## 📋 Prerequisites

Before running this project locally, make sure you have:

* Node.js installed
* MongoDB Atlas account (or local MongoDB instance)
* Cloudinary account for media storage

### MongoDB Atlas

Create a cluster and obtain your MongoDB connection string.

### Cloudinary

Create a Cloudinary account and obtain:

* CLOUDINARY_CLOUD_NAME
* CLOUDINARY_API_KEY
* CLOUDINARY_API_SECRET

---

## ⚙️ Installation & Setup

### Clone the Repository

```bash
git clone https://github.com/bytebykaran/Videotube-backend.git
```

### Navigate to Project Directory

```bash
cd Videotube-backend
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=8000

MONGODB_URI=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run Development Server

```bash
npm run dev
```

---

## 📂 Project Structure

```bash
backend/
├── public/
│   └── temp/

├── src/
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── app.js
│   ├── constants.js
│   └── index.js

├── .env
├── .gitignore
├── package.json
└── README.md
```
## 🗄️ Database Schema

View the database schema here:

[Database Schema Diagram](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

---

## 📌 Core Modules

* Users
* Videos
* Comments
* Likes
* Playlists
* Subscriptions
* Tweets
* Dashboard
* Health Check

---

## 🔮 Future Improvements

* API Documentation with Swagger/OpenAPI
* Unit & Integration Testing
* Docker Containerization
* Redis Caching
* CI/CD Pipeline
* Cloud Deployment (AWS / Render)

---


