import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Homepage from './pages/Homepage';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LogGamePage from './pages/LogGamePage';
import PrivateRoute from './components/PrivateRoute';
import WishlistPage from './pages/WishlistPage';


function App() {
  return (
    <div className="App">
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/auth" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/logmatch" element={<PrivateRoute><LogGamePage /></PrivateRoute>} />
          {/* <Route path="/stats" element={<StatsPage />} />*/}
          <Route path="/wishlist" element={<WishlistPage />} /> 
        </Routes>
      </Router>
    </div>
  );
}

export default App;
