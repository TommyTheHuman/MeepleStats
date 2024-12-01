import { Link } from "react-router-dom";

function Navbar() {
    return ( 
        <nav className="navbar navbar-expand-lg navbar-light bg-light py-4 px-8">
            <div className="container-fluid flex">
                <Link className="navbar-brand mr-16" to="/">MeepleStats</Link>
                <div className="" id="navbarNav">
                    <ul className="navbar-nav flex gap-8">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/auth">Login</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/register">Register</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/logmatch">Log Match</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/stats">Stats</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/wishlist">Wishlist</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
     );
}

export default Navbar;