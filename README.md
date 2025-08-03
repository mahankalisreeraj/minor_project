# 🛍️ EcommerceHub: Smart Seller Dashboard

A feature-rich seller dashboard application built with React that empowers e-commerce sellers to manage their **products**, **orders**, and **analytics** efficiently in real time.

## 🚀 Features

### 📦 Product Management
- Add, edit, and delete products
- Upload product image, price, cost, stock, and description
- Automatic low-stock alerts for inventory below threshold

### 📃 Order Management
- View and filter orders by status (Pending, Processing, Shipped, Delivered, Cancelled)
- Accept, cancel, or update order statuses dynamically
- Visual order summaries with product thumbnails

### 📊 Business Analytics
- Monthly revenue charts
- Top-selling products list
- Average order value and profit estimation
- Conversion rate and low stock insights

### 🔐 Authentication & Roles (Extendable)
- Designed to support Seller/Buyer roles (currently supports Seller UI)

## 🧩 Tech Stack

- **Frontend**: React, JavaScript, CSS (Custom, Modular)
- **Backend (Pluggable)**: REST APIs (mocked via `ApiService.js`)
- **Tooling**: Webpack, ESLint, Babel (configured via Create React App)

## 📁 Project Structure
client/
├── components/
│ ├── SellerDashboard.jsx
│ ├── ProductManagement.jsx
│ ├── OrderManagement.jsx
│ ├── Analytics.jsx
│ ├── Header.jsx
├── services/
│ └── api.js
├── App.js
├── App.css
└── index.js

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/vivekvardhan30/Smart-Seller-Dashboard-for-E-commerce-Management.git
cd Smart-Seller-Dashboard-for-E-commerce-Management/client









