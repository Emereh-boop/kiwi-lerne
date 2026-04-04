import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bird, Trophy, BookOpen, User, Upload, Home, LogIn, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user: authUser, logout } = useAuth()
  const { user } = useUser()
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/lessons', icon: BookOpen, label: 'Lessons' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Bird className="w-8 h-8 text-kiwi-green transform transition-transform group-hover:scale-110 group-hover:rotate-12" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-kiwi-yellow rounded-full animate-pulse"></div>
            </div>
            <span className="text-2xl font-bold text-kiwi-green">Wren</span>
            <span className="text-2xl font-bold text-kiwi-blue">Learn</span>
          </Link>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-kiwi-green text-white shadow-md transform scale-105'
                      : 'text-kiwi-gray hover:bg-kiwi-light-gray hover:text-kiwi-green'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold hidden md:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center space-x-4">
            {!authUser ? (
              <>
                <button
                  onClick={() => navigate('/auth')}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-kiwi-green border-2 border-kiwi-green hover:bg-kiwi-green hover:text-white transition"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="font-semibold hidden md:inline">Log in</span>
                </button>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center space-x-2 bg-kiwi-yellow px-3 py-1 rounded-full">
                  <Trophy className="w-5 h-5 text-kiwi-dark" />
                  <span className="font-bold text-kiwi-dark">{user?.xp || 0} XP</span>
                </div>
                <div className="hidden sm:flex items-center space-x-1">
                  <span className="text-2xl">🔥</span>
                  <span className="font-bold text-kiwi-dark">{user?.streak || 0}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-full bg-kiwi-green text-white flex items-center justify-center font-extrabold">
                    {authUser.name ? authUser.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="font-semibold text-kiwi-dark hidden md:inline">{authUser.name || authUser.email}</span>
                  <button
                    onClick={logout}
                    className="text-kiwi-gray hover:text-kiwi-red"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
