# 🎲 MeepleStats

**MeepleStats** is a self-hosted web application designed to track board game statistics for your group of friends! It allows users to log game sessions, analyze player performance, and manage a wishlist of games. The application is built with a **Flask** backend and a **React** frontend.

---

## 📜 Table of Contents

- [✨ Features](#-features)
- [⚙️ Installation](#-installation)
  - [📌 Prerequisites](#-prerequisites)
  - [🚀 Backend Setup](#-backend-setup)
  - [🎨 Frontend Setup](#-frontend-setup)
  - [▲ Vercel Setup](#-vercel-installation)
- [🛠️ Usage](#-usage)
- [🔗 API Endpoints](#-api-endpoints)
- [🌍 Environment Variables](#-environment-variables)
- [🤝 Contributing](#-contributing)
- [📌 To-Do](#-to-do)
- [📜 License](#-license)

---

## ✨ Features

- User Authentication (Register, Login, Logout)
- Log Game Sessions with players, scores, and duration
- Track Player Statistics (total wins, win rate, longest win streak)
- Manage a Wishlist of board games
- Import Games from BoardGameGeek (BGG) API
- View Global & Player-Specific Statistics

---

## ⚙️ Installation

### 📌 Prerequisites

Ensure you have the following installed:
- Python **3.8+**
- Node.js **14+**
- MongoDB

### 🚀 Backend Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/TommyTheHuman/MeepleStats.git
   cd MeepleStats/backend
   ```

2. Create a virtual environment and activate it:
   ```sh
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install the required dependencies:
   ```sh
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the root directory and configure it (see [Environment Variables](#-environment-variables))

5. Run the backend server:
   ```sh
   python run.py
   ```

### 🎨 Frontend Setup

1. Navigate to the frontend directory:
   ```sh
   cd ../frontend/meeplestats
   ```

2. Install the required dependencies:
   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and configure it (see [Environment Variables](#-environment-variables))

4. Start the frontend development server:
   ```sh
   npm start
   ```

### ▲ Vercel Installation
Just create two different projects in **Vercel** and do the correct environment variables setup, the `.JSON` config files for Vercel are provided

---

## 🛠️ Usage

Open your browser and navigate to the provided URL to access the frontend.
Use the provided API endpoints to interact with the backend.

---

## 🔗 API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /login` - Login a user
- `GET /check-auth` - Check user authentication status

### Game Management
- `GET /games` - Retrieve all games
- `POST /logmatch` - Log a new game session
- `GET /matchHistory` - Retrieve match history

### Wishlist Management
- `GET /wishlist` - Get the wishlist
- `POST /addwishlist` - Add a game to the wishlist
- `DELETE /removewishlist` - Remove a game from the wishlist

### Statistics
- `GET /totHours` - Get total hours played
- `GET /totMatches` - Get total matches played
- `GET /playerWins` - Get total wins for a player
- `GET /playerWinRate` - Get win rate for a player
- `GET /playerLongWinstreak` - Get longest win streak for a player
- `GET /playerHighestWinRate` - Get player with the highest win rate
- `GET /playerGameWins` - Get game with most and least wins for a player
- `GET /gameCoopWinRate` - Get win rate for cooperative games
- `GET /gameNumMatch` - Get number of matches for a game
- `GET /gameAvgDuration` - Get average duration for a game
- `GET /gameBestValue` - Get games with the best price/playtime ratio
- `GET /gameHighestScore` - Get highest score for a game
- `GET /gameAvgScore` - Get average score for a game

### Utilities
- `GET /importGames` - Import games from BoardGameGeek (BGG) API

---

## 🌍 Environment Variables

Create a `.env` file and define the following:

```ini
BGG_USERNAME=your_boardgamegeek_username
JWT_SECRET_KEY=your_secret_key
JWT_ACCESS_TOKEN_EXPIRES=your_expiration_time
JWT_TOKEN_LOCATION=your_token_location
JWT_COOKIE_SECURE=True/False
JWT_ACCESS_COOKIE_NAME=your_cookie_name
JWT_COOKIE_CSRF_PROTECT=True/False
UPLOAD_FOLDER=your_upload_folder_path
CORS_ORIGIN=allowed_origins
MONGO_URI=your_mongo_connection_uri
DB_NAME=your_database_name
VITE_API_URL=your_backend_url
STORAGE_TYPE='s3'#local
S3_ENDPOINT =your_s3_server_url
S3_ACCESS_KEY =your_s3_access_key
S3_SECRET_KEY =your_s3_secret_key
S3_BUCKET_NAME =your_s3_bucket_name
```

---

## 🤝 Contributing

Want to improve MeepleStats? Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## 📌 To-Do

- Improve UI/UX and Dark Mode
- Show images for open matches
- Implement team-based game tracking
- Add achievements system
- Introduce multilingual support
- Create user profile page
- Develop a game collection page
- Add support to upload images on Google Drive

---

## 📜 License

MeepleStats is released under the **MIT License**. See the `LICENSE` file for details.

Happy Gaming!
