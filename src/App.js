import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import "./App.css";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import AssessmentPage from "./pages/AssessmentPage";
import AllAssessmentsPage from "./pages/AllAssessmentsPage.jsx";
import CreateAssessment from './components/instructor/CreateAssessment';
import ResultsPage from "./pages/ResultsPage";
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import InstructorDashboard from './pages/InstructorDashboard';
import StudentProfile from './pages/StudentProfile.jsx';
import CourseUpload from './components/instructor/CourseUpload';
import ProtectedRoute from './components/common/ProtectedRoute';
import MyResultsPage from './pages/MyResultsPage';
import CourseAssessmentsPage from "./pages/CourseAssessmentsPage";
import StudentProgressPage from "./pages/StudentProgressPage";
import { AuthProvider } from './contexts/AuthContext';

// Immediately execute to ensure API_CONFIG is defined globally before any component loads
(function () {
  // Define global configuration for API URLs that will be available to all components
  window.API_CONFIG = {
    BASE_URL: 'https://edusyncbackendapi-e9hrg2a8exgvgwda.centralindia-01.azurewebsites.net',
    UPLOADS_PATH: '/uploads',
    API_URL: 'https://edusyncbackendapi-e9hrg2a8exgvgwda.centralindia-01.azurewebsites.net/api',
    AUTH_URL: 'https://edusyncbackendapi-e9hrg2a8exgvgwda.centralindia-01.azurewebsites.net/api/auth'
  };
})();

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="app-main">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Dashboard routing - will redirect based on role */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Student-specific routes */}
              <Route path="/courses/:courseId/assessments" element={
                <ProtectedRoute>
                  <CourseAssessmentsPage />
                </ProtectedRoute>
              } />

              <Route path="/courses/:courseId/assessment/:assessmentId" element={
                <ProtectedRoute>
                  <AssessmentPage />
                </ProtectedRoute>
              } />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <StudentProfile />
                  </ProtectedRoute>
                }
              />

              <Route path="/assessments" element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <AllAssessmentsPage />
                </ProtectedRoute>
              } />

              <Route path="/courses" element={
                <ProtectedRoute>
                  <CoursesPage />
                </ProtectedRoute>
              } />

              <Route path="/courses/:id" element={
                <ProtectedRoute>
                  <CourseDetailPage />
                </ProtectedRoute>
              } />

              <Route path="/assessment/:id" element={
                <ProtectedRoute>
                  <AssessmentPage />
                </ProtectedRoute>
              } />

              <Route path="/results" element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <MyResultsPage />
                </ProtectedRoute>
              } />

              <Route path="/courses/:courseId/results" element={<ResultsPage />} />

              {/* Instructor-specific routes */}
              <Route path="/instructor" element={
                <ProtectedRoute allowedRoles={['Instructor']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              } />

              <Route path="/courses/create" element={
                <ProtectedRoute allowedRoles={['Instructor']}>
                  <CourseUpload />
                </ProtectedRoute>
              } />

              <Route path="/courses/:courseId/edit" element={
                <ProtectedRoute allowedRoles={['Instructor']}>
                  <CourseUpload />
                </ProtectedRoute>
              } />

              <Route path="/assessment/create" element={
                <ProtectedRoute allowedRoles={['Instructor']}>
                  <CreateAssessment />
                </ProtectedRoute>
              } />

              {/* New student progress route */}
              <Route path="/student-progress" element={
                <ProtectedRoute allowedRoles={['Instructor']}>
                  <StudentProgressPage />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;