// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import LandingPage from './pages/LandingPage';

// pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import JobList from './pages/JobList';
import JobSearch from './pages/JobSearch';
import JobDetail from './pages/JobDetail';
import JobPostings from './pages/JobPostings';
import AddJobForm from './pages/AddJobForm';
import Applicants from './pages/Applicants';
import ApplicantDetail from './pages/ApplicantDetail';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import EditJobForm from './pages/EditJobForm';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import DetailedStats from './components/analytics/DetailedStats';
import InterviewPrepAssistant from './pages/InterviewPrepAssistant';
import ChangePassword from './pages/ChangePassword';
import CompanyProfile from './pages/CompanyProfile';

// App routes with authentication check
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/jobs" element={
        <PrivateRoute>
          <JobList />
        </PrivateRoute>
      } />
      <Route path="/job-search" element={
        <PrivateRoute>
          <JobSearch />
        </PrivateRoute>
      } />
      <Route path="/jobs/:id" element={
        <PrivateRoute>
          <JobDetail />
        </PrivateRoute>
      } />
      <Route path="/job-postings" element={
        <PrivateRoute>
          <JobPostings />
        </PrivateRoute>
      } />
      <Route path="/add-job" element={
        <PrivateRoute>
          <AddJobForm />
        </PrivateRoute>
      } />
      <Route path="/edit-job/:id" element={
        <PrivateRoute>
          <EditJobForm />
        </PrivateRoute>
      } />
      <Route path="/applicants" element={
        <PrivateRoute>
          <Applicants />
        </PrivateRoute>
      } />
      <Route path="/applicant/:applicantId" element={
        <PrivateRoute>
          <ApplicantDetail />
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />
      <Route path="/analytics" element={
        <PrivateRoute>
          <AnalyticsDashboard />
        </PrivateRoute>
      } />
      <Route path="/analytics/detailed" element={
        <PrivateRoute>
          <DetailedStats />
        </PrivateRoute>
      } />
      <Route path="/interview-prep" element={
        <PrivateRoute>
          <InterviewPrepAssistant />
        </PrivateRoute>
      } />
      <Route path="/change-password" element={
        <PrivateRoute>
          <ChangePassword />
        </PrivateRoute>
      } />
      <Route path="/company/:companyId" element={<CompanyProfile />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Router>
          <div className="app">
          <Header />
            <main className="main-content">
            <AppRoutes />
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;