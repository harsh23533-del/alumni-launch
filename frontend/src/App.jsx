import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GuestOnlyRoute from './components/GuestOnlyRoute';
import Topbar from './components/Topbar';
import MobileBottomNav from './components/MobileBottomNav';

import Landing from './pages/Landing';
import SignupChoice from './pages/SignupChoice';
import AlumniSignup from './pages/AlumniSignup';
import StudentSignup from './pages/StudentSignup';
import CompanySignup from './pages/CompanySignup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import BrowseStartups from './pages/BrowseStartups';
import PostStartup from './pages/PostStartup';
import AlumniDashboard from './pages/AlumniDashboard';
import StudentApplications from './pages/StudentApplications';
import BrowseJobs from './pages/BrowseJobs';
import PostJob from './pages/PostJob';
import JobsDashboard from './pages/JobsDashboard';
import Chat from './pages/Chat';
import Ideas from './pages/Ideas';
import Groups from './pages/Groups';
import Sponsors from './pages/Sponsors';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Topbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<GuestOnlyRoute><SignupChoice /></GuestOnlyRoute>} />
          <Route path="/signup/alumni" element={<GuestOnlyRoute><AlumniSignup /></GuestOnlyRoute>} />
          <Route path="/signup/student" element={<GuestOnlyRoute><StudentSignup /></GuestOnlyRoute>} />
          <Route path="/signup/company" element={<GuestOnlyRoute><CompanySignup /></GuestOnlyRoute>} />
          <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/startups" element={<BrowseStartups />} />
          <Route path="/jobs" element={<BrowseJobs />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/messages" element={
            <ProtectedRoute><Messages /></ProtectedRoute>
          } />

          <Route path="/alumni/post" element={
            <ProtectedRoute role="alumni"><PostStartup /></ProtectedRoute>
          } />
          <Route path="/alumni/dashboard" element={
            <ProtectedRoute role="alumni"><AlumniDashboard /></ProtectedRoute>
          } />
          <Route path="/student/applications" element={
            <ProtectedRoute role="student"><StudentApplications /></ProtectedRoute>
          } />

          <Route path="/jobs/post" element={
            <ProtectedRoute role={["alumni", "company"]}><PostJob /></ProtectedRoute>
          } />
          <Route path="/jobs/dashboard" element={
            <ProtectedRoute role={["alumni", "company"]}><JobsDashboard /></ProtectedRoute>
          } />

          <Route path="/chat" element={<Chat />} />

          <Route path="/admin/login" element={<GuestOnlyRoute><AdminLogin /></GuestOnlyRoute>} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
          } />
        </Routes>
        <MobileBottomNav />
      </AuthProvider>
    </BrowserRouter>
  );
}
