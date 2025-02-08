# MeepleStats

MeepleStats is a web application designed to track board game statistics. It allows users to log their game sessions, track player performance, and manage a wishlist of games. The application is built with a Flask backend and a React frontend.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## Features

- User authentication (register, login, logout)
- Log game sessions with details like players, scores, and duration
- Track player statistics such as total wins, win rate, and longest win streak
- Manage a wishlist of games
- Import games from BoardGameGeek (BGG) API
- View global and player-specific statistics

## Installation

### Prerequisites

- Python 3.8+
- Node.js 14+
- MongoDB

### Backend Setup

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

3. Install the required packages:

    ```sh
    pip install -r requirements.txt
    ```

4. Create you own `.env` file in the root directory and add all the required environment variables. See [Environment Variables](#environment-variables).
&nbsp;
5. Run the backend server:

    ```sh
    python run.py
    ```

### Frontend Setup

1. Navigate to the meeplestats directory:

    ```sh
    cd ../frontend/meeplestats
    ```

2. Install the required packages:

    ```sh
    npm install
    ```

3. Start the frontend development server:

    ```sh
    npm start
    ```

## Usage

- Open your browser and navigate to the provided URL to access the frontend.
- Use the provided endpoints to interact with the backend API.

## API Endpoints

### Authentication

- `POST /api/register`: Register a new user
- `POST /api/login`: Login a user
- `GET /api/check-auth`: Check if the user is authenticated

### Game Management

- `GET /api/games`: Get all games
- `POST /api/logmatch`: Log a new game session
- `GET /api/matchHistory`: Get match history

### Wishlist Management

- `GET /api/wishlist`: Get the wishlist
- `POST /api/addwishlist`: Add a game to the wishlist
- `DELETE /api/removewishlist`: Remove a game from the wishlist

### Statistics

- `GET /api/totHours`: Get total hours played
- `GET /api/totMatches`: Get total matches played
- `GET /api/playerWins`: Get total wins for a player
- `GET /api/playerWinRate`: Get win rate for a player
- `GET /api/playerLongWinstreak`: Get longest win streak for a player
- `GET /api/playerHighestWinRate`: Get player with the highest win rate
- `GET /api/playerGameWins`: Get game with most and least wins for a player
- `GET /api/gameCoopWinRate`: Get win rate for cooperative games
- `GET /api/gameNumMatch`: Get number of matches for a game
- `GET /api/gameAvgDuration`: Get average duration for a game
- `GET /api/gameBestValue`: Get games with the best price/tot_hours_played ratio
- `GET /api/gameHighestScore`: Get highest score for a game
- `GET /api/gameAvgScore`: Get average score for a game

### Utilities

- `GET /api/importGames`: Import games from BGG API

## Environment Variables

- `BGG_USERNAME`: Your BoardGameGeek username
- `JWT_SECRET_KEY`: Secret key for JWT
- `JWT_ACCESS_TOKEN_EXPIRES`: JWT token expiration time
- `JWT_TOKEN_LOCATION`: Location of the JWT token
- `JWT_COOKIE_SECURE`: Secure flag for JWT cookie
- `JWT_ACCESS_COOKIE_NAME`: Name of the JWT cookie
- `JWT_COOKIE_CSRF_PROTECT`: CSRF protection for JWT cookie
- `UPLOAD_FOLDER`: Folder for file uploads
- `CORS_ORIGINS`: Allowed origins for CORS
- `MONGO_URI`: MongoDB connection URI
- `DB_NAME`: MongoDB database name

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## ToDo

- [ ] Graphic refinement
- [ ] Open matches to show saved images
- [ ] New logic to handle team games
- [ ] Add achievements logic
