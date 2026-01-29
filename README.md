# LSU Dining Menu Manager

A modern web app to browse LSU dining hall menus and plan your meals with nutrition tracking.

## Features

- 📅 Browse daily menus for breakfast, lunch, and dinner
- 🥗 Filter by dietary preferences (vegan, vegetarian, high protein, low calorie)
- 📊 Track nutrition (protein, carbs, fat, sugar, calories)
- 🎯 Set protein goals and get smart recommendations
- 📱 Fully responsive mobile design
- 🎨 Beautiful dark theme with glassmorphism effects

## Deployment

### Frontend (Netlify)
1. Push code to GitHub
2. Connect repo to Netlify
3. Set environment variable: `VITE_API_URL` to your backend URL
4. Deploy!

### Backend (Render)
1. Go to [render.com](https://render.com)
2. Create new Web Service from GitHub repo
3. Set Root Directory: `server`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Deploy!

### Environment Variables

Create a `.env` file in the root:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

## Local Development

1. Install dependencies:
```bash
npm install
cd server && npm install && cd ..
```

2. Start backend:
```bash
cd server
npm start
```

3. Start frontend (in another terminal):
```bash
npm run dev
```

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, Puppeteer
- **Deployment**: Netlify (frontend) + Render (backend)

## License

MIT
