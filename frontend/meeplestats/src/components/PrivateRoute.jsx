import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function PrivateRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        fetch('/api/check-auth', { method: 'GET', credentials: 'include' })
            .then((response) => {
                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            })
            .catch(() => setIsAuthenticated(false));
    }, []);

    if (isAuthenticated === null) {
        return <div>Loading...</div>; // Puoi mettere uno spinner qui.
    }

    return isAuthenticated ? children : <Navigate to="/auth" />;
}
export default PrivateRoute;