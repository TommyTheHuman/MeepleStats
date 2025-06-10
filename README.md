# 🎲 MeepleStats

**MeepleStats** is a self-hosted web application designed to track board game statistics for your group of friends! It allows users to log game sessions, analyze player performance, and manage a wishlist of games. The application is built with a **Flask** backend and a **React** frontend.

---

## 📜 Table of Contents

- [✨ Features](#-features)
- [⚙️ Installation](#️-installation)
  - [📌 Prerequisites](#-prerequisites)
  - [🚀 Backend Setup](#-backend-setup)
  - [🎨 Frontend Setup](#-frontend-setup)
  - [▲ Vercel Setup](#-vercel-installation)
  - [🐳 Docker Deployment](#-docker-deployment-pre-built-images)
- [🛠️ Usage](#️-usage)
- [📚 Rulebook Chat (RAG System)](#-rulebook-chat-rag-system)
- [🧮 Score Sheet System](#-score-sheet-system)
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
- Chat to ask questions about game rules
- Configurable score sheets

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

## Additional Dockge Instructions

Instructions for Dockge:
In your stacks folder, pull repo from GitHub:
   ```sh
   git clone https://github.com/TommyTheHuman/MeepleStats.git
   ```

Then rename the pulled folder:
   ```sh
mv MeepleStats meeplestats
  ```

Then in dockge, pull and update to pull the latest configurations and update. Missing this step could result in unexpected failures. 


### Notes

- If changes are made to the code, the GitHub workflow will automatically build and push updated images to GHCR upon merges or pushes to `main`.

---

## 🛠️ Usage

Open your browser and navigate to the provided URL to access the frontend.
Use the provided API endpoints to interact with the backend.
Decide where to store the `JWT Token`: you can use either cookies or your browser's local storage. Make sure to set up the [Environment Variables](#-environment-variables) correctly.
Additionally, you can choose where to store images from your game nights. You can either save them locally or use Amazon Simple Storage Service (S3). In either case, ensure that the relevant variables are configured correctly.

---

## 📚 Rulebook Chat (RAG System)
The Rulebook Chat feature lets you upload board game rulebooks as PDFs and then ask questions about game rules without manually searching through pages. Simply upload a rulebook for your game, then ask questions like "How do I set up the game?" or "What happens when two players tie?" The system will find the relevant sections in the rulebook and provide specific answers with page references, making it easy to resolve rule questions during gameplay.

---

## 🧮 Score Sheet System
The Score Sheet Creator helps you track complex game scoring without pen and paper. Create custom score sheets for games by defining scoring categories with different types (numbers or text) and rules. During gameplay, anyone can access the Score Sheet page, select a game, add players, and track scores in real-time. The system automatically calculates totals and displays scoring rules when needed. This feature is perfect for games with multiple scoring categories, helping you focus on the fun rather than the math.

If you want to contribute, you can submit with a PR new configs to create a score sheets database.

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

### Backend Environment Variables
Create a `.env` file in the root directory of the project `/meeplestats` and define the following:

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
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=gamerulebooks
EMBEDDING_MODEL=embedding_model_name # for example: BAAI/bge-small-en-v1.5
PINECONE_DIMENSION=384
OPENROUTER_API_KEY=your_openrouter_key
LLM_MODEL=llm_model_name # for example: qwen/qwq-32b:free
EMBEDDING_TYPE='gemini' or 'local'
GEMINI_API_KEY=your_gemini_key
ENABLE_RAG=True/False
```

### Frontend Environment Variables
Create a `.env` file in the `/frontend/meeplestats` directory of the project and define the following:

```ini
VITE_API_URL=your_backend_url
VITE_JWT_STORAGE='localstorage' or 'cookie'
VITE_ENABLE_RAG=True/False 
VITE_ALLOWED_HOSTS=allowed_hosts_coma_separated
```

---

## 🤝 Contributing

Want to improve MeepleStats? Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## 📌 To-Do

- [x] Improve UI/UX
- [ ] Support to Dark Mode
- [x] Show images for open matches
- [x] Implement team-based game tracking
- [x] Add achievements system
- [ ] Introduce multilingual support
- [ ] Create user profile page
- [x] Develop a game collection page
- [x] Add support to upload images on Google Drive
- [x] Create a page to randomly select a game and a timer to track the play time
- [x] Implement a RAG pipeline to retirve information about game rules

---

## 📜 License

MeepleStats is released under the **MIT License**. See the `LICENSE` file for details.

Happy Gaming!
