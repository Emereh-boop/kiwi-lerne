import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { userAPI } from '../lib/api'

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: 'Student',
    xp: 0,
    level: 1,
    streak: 0,
    achievements: [],
    learningStyle: 'gamified', // 'gamified' or 'audiobook'
    preferences: {
      soundEffects: true,
      animations: true,
      difficulty: 'medium',
    }
  })

  const [lastActiveDate, setLastActiveDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user: authUser } = useAuth()

  // Load profile from backend when user logs in
  useEffect(() => {
    (async () => {
      if (!authUser) {
        setUser({
          name: 'Student',
          xp: 0,
          level: 1,
          streak: 0,
          achievements: [],
          learningStyle: 'gamified',
          preferences: {
            soundEffects: true,
            animations: true,
            difficulty: 'medium',
          }
        })
        setLoading(false)
        return
      }

      try {
        const profile = await userAPI.getProfile()
        const achievements = await userAPI.getAchievements()
        
        setUser({
          name: profile.name || authUser.name || 'Student',
          xp: profile.xp || 0,
          level: profile.level || 1,
          streak: profile.streak || 0,
          achievements: achievements || [],
          learningStyle: profile.learning_style || 'gamified',
          preferences: profile.preferences || {
            soundEffects: true,
            animations: true,
            difficulty: 'medium',
          }
        })

        if (profile.last_active_date) {
          setLastActiveDate(new Date(profile.last_active_date))
        }

        checkStreak(profile.last_active_date)
      } catch (error) {
        console.error('Failed to load profile:', error)
        // Fallback to defaults
        setUser(prev => ({
          ...prev,
          name: authUser.name || prev.name,
        }))
      } finally {
        setLoading(false)
      }
    })()
  }, [authUser?.id])

  const checkStreak = async (lastActiveDateFromDB = null) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const lastActive = lastActiveDateFromDB ? new Date(lastActiveDateFromDB) : lastActiveDate
    
    let newStreak = 1
    if (lastActive) {
      const lastActiveDateStr = lastActive.toDateString()
      const yesterdayStr = yesterday.toDateString()
      const todayStr = today.toDateString()
      
      if (lastActiveDateStr === yesterdayStr) {
        newStreak = (user.streak || 0) + 1
      } else if (lastActiveDateStr !== todayStr) {
        newStreak = 1
      } else {
        newStreak = user.streak || 1
      }
    }
    
    setLastActiveDate(today)
    
    // Update streak in backend
    if (authUser && newStreak !== user.streak) {
      try {
        await userAPI.updateProfile({
          streak: newStreak,
          lastActiveDate: today.toISOString().split('T')[0]
        })
        setUser(prev => ({ ...prev, streak: newStreak }))
      } catch (error) {
        console.error('Failed to update streak:', error)
      }
    }
  }

  const addXP = async (amount) => {
    // Optimistic update
    setUser(prev => {
      const newXP = prev.xp + amount
      const newLevel = Math.floor(newXP / 100) + 1
      return {
        ...prev,
        xp: newXP,
        level: newLevel
      }
    })

    // Sync with backend
    if (authUser) {
      try {
        const result = await userAPI.addXP(amount)
        // Backend returns updated profile with correct level calculation
        setUser(prev => ({
          ...prev,
          xp: result.profile.xp,
          level: result.profile.level
        }))
      } catch (error) {
        console.error('Failed to add XP:', error)
        // Revert on error
        setUser(prev => ({
          ...prev,
          xp: prev.xp - amount,
          level: Math.floor((prev.xp - amount) / 100) + 1
        }))
      }
    }
  }

  const addAchievement = async (achievement) => {
    // Optimistic update
    setUser(prev => ({
      ...prev,
      achievements: [...prev.achievements, achievement]
    }))

    // Sync with backend
    if (authUser) {
      try {
        await userAPI.addAchievement({
          title: achievement.title,
          description: achievement.description
        })
      } catch (error) {
        console.error('Failed to add achievement:', error)
        // Revert on error
        setUser(prev => ({
          ...prev,
          achievements: prev.achievements.filter(a => a.title !== achievement.title)
        }))
      }
    }
  }

  const updateLearningStyle = async (style) => {
    setUser(prev => ({ ...prev, learningStyle: style }))
    
    if (authUser) {
      try {
        await userAPI.updateProfile({ learningStyle: style })
      } catch (error) {
        console.error('Failed to update learning style:', error)
      }
    }
  }

  const updatePreferences = async (preferences) => {
    setUser(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences }
    }))
    
    if (authUser) {
      try {
        await userAPI.updateProfile({ preferences })
      } catch (error) {
        console.error('Failed to update preferences:', error)
      }
    }
  }

  const value = {
    user,
    loading,
    addXP,
    addAchievement,
    updateLearningStyle,
    updatePreferences,
    checkStreak
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
