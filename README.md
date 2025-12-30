# 🌙 MoonPages: Interactive Online Book Reading Platform

## Project Overview
MoonPages is a full-stack web application that allows users to read books online, track their reading progress, and interact with an AI-powered chatbot for summaries, recommendations, and Q&A. Users can bookmark pages, highlight text, participate in chapter discussions, and enjoy a personalized, interactive reading experience.  

Authors can upload and manage books. Admins can monitor user activity, and maintain the platform. The project demonstrates full-stack proficiency using **MERN + TypeScript** stack, following RAD and agile development principles.

---

## Features

### User Features
- Registration and login (Reader role)
- Online book reader with pagination and dark mode
- Bookmarking and text highlighting
- Reading progress tracker and dashboard
- AI chatbot for book summaries, Q&A, and recommendations
- Chapter-wise comments
- Search and filter books by genre, author, title, or content
- Responsive UI with Tailwind CSS and React components

### Author Features
- Book upload and management
- Chapter-wise comments
- Role-based authorization

### Admin Features
- Monitoring user activity
- Role-based authorization
- Admin account creation

---

## Technologies Used

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB (Atlas)
- Mongoose
- JWT for authentication
- bcryptjs for password hashing
- OpenAI API for AI chatbot
- Cloudinary for book cover uploads

---

## System Architecture

**📁 Folder Structure (Backend)**

```
back-end/
├── node_modules/
├── src/
      ├── controller/
      ├── middleware/
      ├── models/
      ├── routes/
      ├── utils/
      └── index.ts
├── .env
├── .gitignore
├── package-lock.json
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```
---

##⚙️ Setup and Installation

1. Clone the repository:
```bash
git clone https://github.com/sachi-thakshi/MoonPages-BE.git
cd MoonPages-BE
```

2. Install dependencies:
```bash
npm install
npm install -D typescript ts-node-dev
npx tsc --init
npm install express
npm install mongoose
```

3. Create .env file:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET==your_jwt_refresh_secret_key
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your_email
EMAIL_PASS=your_email_project_passkey
CLIENT_URL=http://localhost:5173
```

4. Run development server:
```bash
npm run dev
```

5. Build & run production server:
```bash
npm run build
npm start
npm run dev
```

## Deployement
Backend URL: vercel – https://moon-pages-be.vercel.app
