import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Topbar from './components/Topbar';

import Landing from './pages/Landing';
import SignupChoice from './pages/SignupChoice';
import AlumniSignup from './pages/AlumniSignup';
import StudentSignup from './pages/StudentSignup';
import Login from './pages/Login';
import BrowseStartups from './pages/BrowseStartups';
import PostStartup from './pages/PostStartup';
import AlumniDashboard from './pages/AlumniDashboard';
import StudentApplications from './pages/StudentApplications';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Topbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<SignupChoice />} />
          <Route path="/signup/alumni" element={<AlumniSignup />} />
          <Route path="/signup/student" element={<StudentSignup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/startups" element={<BrowseStartups />} />

          <Route path="/alumni/post" element={
            <ProtectedRoute role="alumni"><PostStartup /></ProtectedRoute>
          } />
          <Route path="/alumni/dashboard" element={
            <ProtectedRoute role="alumni"><AlumniDashboard /></ProtectedRoute>
          } />
          <Route path="/student/applications" element={
            <ProtectedRoute role="student"><StudentApplications /></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
