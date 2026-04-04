import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const Auth = () => {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const from = (location.state && location.state.from) || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login({ email, password })
        toast.success('Welcome back!')
      } else {
        await register({ name, email, password })
        toast.success('Account created!')
      }
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-kiwi-light-gray rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`px-6 py-2 rounded-lg font-semibold ${mode === 'login' ? 'bg-white shadow' : 'text-kiwi-gray'}`}
            >
              Log in
            </button>
            <button
              onClick={() => setMode('register')}
              className={`px-6 py-2 rounded-lg font-semibold ${mode === 'register' ? 'bg-white shadow' : 'text-kiwi-gray'}`}
            >
              Register
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-kiwi-dark mb-2 text-center">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="text-center text-kiwi-gray mb-6">Access your Wren Learn profile</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-semibold text-kiwi-dark mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-kiwi-light-gray rounded-xl focus:border-kiwi-green focus:outline-none"
                placeholder="Your name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-kiwi-dark mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-kiwi-light-gray rounded-xl focus:border-kiwi-green focus:outline-none"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-kiwi-dark mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-kiwi-light-gray rounded-xl focus:border-kiwi-green focus:outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Auth
