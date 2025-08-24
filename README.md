# Sithee Backend API

## Overview
The Sithee Backend is a Node.js/Express REST API for managing products, orders, users, and admin operations for the Sithee Food Masala platform. It supports real-time updates, authentication, and integrates with MongoDB and Cloudinary.

## Features
- RESTful API for products, orders, users, and admin
- JWT authentication for admin and users
- Real-time order updates via Socket.IO
- Cloudinary integration for image uploads
- MongoDB for data storage
- Order and product analytics endpoints

## Tech Stack
- Node.js & Express.js
- MongoDB (Mongoose)
- Socket.IO
- Cloudinary
- JWT (jsonwebtoken)
- dotenv

## Getting Started
1. Install dependencies: `npm install`
2. Set up your `.env` file (see `.env.example`)
3. Start the server: `npm start`
4. API runs at `http://localhost:5000/`

---
