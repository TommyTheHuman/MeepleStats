import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const PrivateRoute = ({ element: Component, ...rest }) => {
    console.log(Cookies.get('jwt_token'));
    const isAuthenticated = !!Cookies.get('jwt_token');

    return isAuthenticated ? <Component {...rest} /> : <Navigate to="/auth" />;
};

export default PrivateRoute;