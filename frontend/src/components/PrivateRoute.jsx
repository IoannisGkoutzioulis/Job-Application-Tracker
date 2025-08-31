// src/components/PrivateRoute.jsx
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;