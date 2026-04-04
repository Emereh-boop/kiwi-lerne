import React, { createContext, useContext, useEffect, useState } from 'react'
import { authAPI, getToken } from '../lib/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Secure authentication using backend API with JWT tokens
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated via token
    (async () => {
      const token = getToken()
      if (token) {
        try {
          const data = await authAPI.getCurrentUser()
          setUser(data.user)
        } catch (error) {
          // Token invalid or expired, clear it
          authAPI.logout()
          setUser(null)
        }
      }
      setLoading(false)
    })()
  }, [])

  const register = async ({ name, email, password }) => {
    try {
      const data = await authAPI.register({ name, email, password })
      setUser(data.user)
      return data.user
    } catch (error) {
      throw error
    }
  }

  const login = async ({ email, password }) => {
    try {
      const data = await authAPI.login({ email, password })
      setUser(data.user)
      return data.user
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    authAPI.logout()
    setUser(null)
  }

  const value = { user, loading, register, login, logout }
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
