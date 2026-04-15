import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Lessons from './pages/Lessons'
import Lesson from './pages/Lesson'
import Profile from './pages/Profile'
import Auth from './pages/Auth.jsx'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { UserProvider } from './contexts/UserContext'
import { DocumentProvider } from './contexts/DocumentContext'

function PrivateRoute({ element }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-kiwi-dark">
        Loading session...
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  return element
}

function App() {
  return (
    <div className="min-h-screen bg-kiwi-light-gray">
      <AuthProvider>
        <UserProvider>
          <DocumentProvider>
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/upload" element={<PrivateRoute element={<Upload />} />} />
                <Route path="/lessons" element={<PrivateRoute element={<Lessons />} />} />
                <Route path="/lesson/:id" element={<PrivateRoute element={<Lesson />} />} />
                <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </DocumentProvider>
        </UserProvider>
      </AuthProvider>
    </div>
  )
}

export default App
