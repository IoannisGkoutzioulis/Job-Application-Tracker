// src/pages/Dashboard.jsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import JobSeekerDashboard from '../components/JobSeekerDashboard';
import CompanyDashboard from '../components/CompanyDashboard';
import './Dashboard.css';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useTheme();

  // If user is not logged in, this shouldn't render (PrivateRoute handles this)
  if (!currentUser) {
    return <div className="loading-container">Loading...</div>;
  }

  // Render dashboard based on user role
  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {currentUser.user_type === 'jobseeker' ? (
          <JobSeekerDashboard user={currentUser} />
        ) : (
          <CompanyDashboard user={currentUser} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;