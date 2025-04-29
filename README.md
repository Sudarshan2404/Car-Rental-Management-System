# 🚗 Car Rental Management System

A full-stack car rental platform with separate servers for admin and consumer roles. This application allows customers to browse and rent cars, while admins can manage cars, bookings, and users via a dedicated dashboard.

---

## 🌐 Project Overview

- 🧍‍♂️ **Consumer App**: Runs on `http://localhost:3000`
- 👨‍💼 **Admin App**: Runs on `http://localhost:4000`

---

## ✨ Key Features

### 🔹Consumer (Port 3000)
- Browse available cars
- Register & login
- Book a car and view booking status
- Cancel bookings
- View invoices

### 🔸Admin (Port 4000)
- Admin authentication
- Add, update, delete cars
- Manage all bookings (status updates)
- View customer details
- Generate invoices

---

## 🧰 Tech Stack

| Layer        | Tech                                 |
|--------------|--------------------------------------|
| Frontend     | HTML, CSS, JavaScript, EJS           |
| Backend      | Node.js, Express.js                  |
| Database     | PostgreSQL                           |
| Authentication | Passport.js, express-session      |

---
## Consumer Panel

**Home page**

![Screenshot (54)](https://github.com/user-attachments/assets/d8c929cc-2099-4f4e-b4c2-fe5c3154d079)

**Collection page**

![Car Collection 1](https://github.com/user-attachments/assets/d9576dcc-d9f1-4415-8a7d-e7b8728b1e50)


![Car Collection 2](https://github.com/user-attachments/assets/816d2639-5931-41b8-85b2-779dda7539d4)

**Login and Registration page**

![Login Page](https://github.com/user-attachments/assets/d258b2e1-2bcf-45b8-b1e6-b3bae845569b)


![Registration page](https://github.com/user-attachments/assets/ee13d953-1bda-4090-8779-4134a67253d8)

**Billing Page**

![Billing Page](https://github.com/user-attachments/assets/fb16d624-ef01-46a7-8c11-cfc44a611b27)

**Account and order tracking page**
![Account and order tracking page](https://github.com/user-attachments/assets/40bce991-67c1-4542-8b4a-5519d94b3686)

## Admin Panel

**Dashboard**

![Admin Dashboard](https://github.com/user-attachments/assets/007a6882-a68c-454a-b735-aedde2b0886f)

**Collection**

![Admin car Collection:- ](https://github.com/user-attachments/assets/8b435cf7-97a3-48a3-b4e3-106833e01dfc)

**Add Car**

![Add Car:-](https://github.com/user-attachments/assets/1b5d30e9-1cad-45fe-943d-1f622eceb6b4)

## 🛠 Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Sudarshan2404/Car-Rental-Management-System.git
```

```bash
cd Car-Rental-Management-System
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Your Postgre Sql Database

```bash
CREATE TABLE cars (
id SERIAL PRIMARY KEY,
model TEXT UNIQUE NOT NULL,
seats INT,
average INT,
category TEXT,
image TEXT
);


CREATE TABLE users(
id SERIAL NOT NULL,
username TEXT UNIQUE NOT NULL,
email TEXT,
password TEXT
fname TEXT,
lname TEXT
);

CREATE TABLE admins(
id SERIAL PRIMARY KEY,
username TEXT UNIQUE NOT NULL,
email TEXT,
password TEXT,
fname TEXT,
lname TEXT
);

CREATE TABLE orders(
id SERIAL PRIMARY KEY,
adress TEXT,
adress2 TEXT,
cars_id INTEGER REFERENCES cars(id),
user_id INTEGER REFERENCES users(id),
date DATE,
bill INTEGER,
days INTEGER,
status TEXT
)

```

### 4. Update .env file

```bash
SESSION_SECRET="Your_Secret"
PG_USER="postgres"
PG_HOST="localhost"
PG_DATABASE="your_database"
PG_PASSWORD="your_password"
PG_PORT="5432"
```

### 5. Start The Server
```bash
node conserver.js
```

Start the admin server in another terminal
```bash
node adminServer.js
```
```
Consumer: http://localhost:3000

Admin: http://localhost:4000
```










