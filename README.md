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
  - [🐳 Docker Deployment](#-docker-deployment-pre-built-images)
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
- Local or Remote image storage
- Achievement system
- Explore match history

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

### 🐳 Docker Deployment (Pre-built Images)

The project now includes a GitHub Actions workflow that builds and publishes Docker images for both the backend and frontend to GitHub Container Registry (GHCR). This allows you to deploy the application without building the images locally.

#### Prerequisites

- Docker and Docker Compose must be installed on your deployment system.
- Ensure your `.env` file is configured properly and placed in the project root.

#### Deployment Instructions

1. **Clone the repository to your server (or pull the latest changes):**
   ```sh
   git clone https://github.com/TommyTheHuman/MeepleStats.git
   cd MeepleStats
   ```

2. **Configure environment variables:**
   - Create a `.env` file in the project root with all required settings (see [Environment Variables](#-environment-variables) below).

3. **Deploy using Docker Compose:**

   The provided `docker-compose.yml` uses the pre-built images from GHCR. 
   
   To deploy, simply run:
   ```sh
   docker-compose up -d
   ```

4. **Access the Application:**
   - The backend will be available on port 5000.
   - The frontend will be accessible on port 5173.

### Notes

- If changes are made to the code, the GitHub workflow will automatically build and push updated images to GHCR upon merges or pushes to `main`.

---

## 🛠️ Usage

Open your browser and navigate to the provided URL to access the frontend.
Use the provided API endpoints to interact with the backend.
Decide where to store the `JWT Token`: you can use either cookies or your browser's local storage. Make sure to set up the [Environment Variables](#-environment-variables) correclty.
Additionally, you can choose where to store images from your game nights. You can either save them locally or use Amazon Simple Storage Service (S3). In either case, ensure that the relevant variables are configured correctly.

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

Create a `.env` file and define the following for the backend:

```ini
BGG_USERNAME=your_boardgamegeek_username
JWT_SECRET_KEY=your_secret_key
JWT_ACCESS_TOKEN_EXPIRES=your_expiration_time
JWT_TOKEN_LOCATION=your_token_location
JWT_COOKIE_SECURE=True/False
JWT_ACCESS_COOKIE_NAME=your_cookie_name
JWT_COOKIE_CSRF_PROTECT=True/False
JWT_STORAGE='localstorage' or 'cookie'
UPLOAD_FOLDER=your_upload_folder_path
CORS_ORIGIN=allowed_origins
MONGO_URI=your_mongo_connection_uri
DB_NAME=your_database_name
STORAGE_TYPE='s3' or 'local'
S3_ENDPOINT=your_s3_server_url
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
S3_BUCKET_NAME=your_s3_bucket_name
```

Create a `.env` file and define the following for the frontend:

```ini
VITE_API_URL=your_backend_url
VITE_JWT_STORAGE='localstorage' or 'cookie' 
```

---

## 🤝 Contributing

Want to improve MeepleStats? Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## 📌 To-Do

- [x] Improve UI/UX
- [ ] Support to Dark Mode
- [ ] Show images for open matches
- [x] Implement team-based game tracking
- [x] Add achievements system
- [ ] Introduce multilingual support
- [ ] Create user profile page
- [x] Develop a game collection page
- [x] Add support to upload images on Google Drive
- [x] Create a page to randomly select a game and a timer to track the play time
- [ ] Implement a RAG pipeline to retirve information about game rules

---

## 📜 License

MeepleStats is released under the **MIT License**. See the `LICENSE` file for details.

Happy Gaming!
