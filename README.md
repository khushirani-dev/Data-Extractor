# 🎓 Multiple Data Extractor — MERN Stack

Extract live data of institutes and coaching centers by place name.

## Features
- Search by city/area/locality
- Extracts: Name, Business Phone, WhatsApp, Email, Website, Rating
- Filter by type: Coaching, Institute, School, College, Tuition
- Save results to MongoDB
- Export to Excel (.xlsx) or CSV
- Load more results (pagination)

---

## 📋 Prerequisites
- Node.js v18+ → https://nodejs.org
- MongoDB → https://www.mongodb.com/try/download/community (or use MongoDB Atlas free cloud)
- Google Places API Key (see below)

---

## 🔑 Get Google Places API Key

1. Go to https://console.cloud.google.com
2. Create a new project: "Institute Extractor"
3. Go to APIs & Services → Library
4. Enable: **Places API** and **Maps JavaScript API**
5. Go to APIs & Services → Credentials → Create API Key
6. Copy the key (starts with AIzaSy...)

---

## 🚀 Setup & Run

### Step 1 — Clone / Download this project

### Step 2 — Add your API key
```
cd server
cp .env.example .env
```
Open `.env` and replace `YOUR_GOOGLE_PLACES_API_KEY_HERE` with your actual key.
Also set your MongoDB URI if using Atlas.

### Step 3 — Install dependencies
```
npm install           # root
cd server && npm install
cd ../client && npm install
```

### Step 4 — Run the app
```
# From root folder:
npm run dev
```
- Backend runs at: http://localhost:5000
- Frontend runs at: http://localhost:3000

---

## 📁 Project Structure

```
institute-extractor/
├── server/
│   ├── index.js              # Express entry point
│   ├── .env.example          # Environment variables template
│   ├── models/
│   │   └── Institute.js      # MongoDB schema
│   ├── controllers/
│   │   ├── searchController.js   # Google Places API logic
│   │   ├── savedController.js    # Save/fetch/delete from DB
│   │   └── exportController.js   # Excel/CSV export
│   └── routes/
│       ├── search.js
│       ├── saved.js
│       └── export.js
├── client/
│   └── src/
│       ├── App.js            # Main app + navigation
│       ├── pages/
│       │   ├── SearchPage.js # Search UI
│       │   └── SavedPage.js  # Saved data UI
│       ├── components/
│       │   ├── InstituteTable.js  # Results table
│       │   └── Toast.js           # Notification
│       └── services/
│           └── api.js        # Axios API calls
└── package.json              # Root scripts
```

---

## 📌 Notes
- **Email**: Google Places API does not provide email addresses. This field shows N/A. You can add a web scraper (Puppeteer) to extract emails from institute websites.
- **WhatsApp**: Auto-generated from the business phone number.
- **Free tier**: Google gives $200/month free credit — enough for ~5,000 searches.

---

## 🔧 Next Improvements
- [ ] Add Puppeteer to scrape emails from websites
- [ ] Add user authentication (JWT)
- [ ] Add bulk WhatsApp messaging integration
- [ ] Add map view of results
- [ ] Deploy to cloud (Railway + Vercel)
