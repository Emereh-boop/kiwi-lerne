import React, { useState } from 'react'
import { User, Trophy, Flame, Settings, Headphones, Gamepad2, Volume2, Zap, Award, Calendar, CheckCircle } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { useDocuments } from '../contexts/DocumentContext'

const Profile = () => {
  const { user, addXP, updateLearningStyle, updatePreferences } = useUser()
  const { lessons } = useDocuments()
  const [activeTab, setActiveTab] = useState('overview')

  const stats = {
    totalLessons: lessons.length,
    completedLessons: lessons.filter(l => l.completed).length,
    totalXP: lessons.reduce((acc, l) => acc + (l.completed ? l.xp : 0), 0),
    averageScore: lessons.length > 0 
      ? Math.round(lessons.reduce((acc, l) => acc + l.progress, 0) / lessons.length)
      : 0
  }

  const achievements = [
    { title: 'First Steps', description: 'Complete your first lesson', icon: '🎯', unlocked: stats.completedLessons >= 1 },
    { title: 'Knowledge Seeker', description: 'Complete 5 lessons', icon: '📚', unlocked: stats.completedLessons >= 5 },
    { title: 'XP Master', description: 'Earn 500 XP', icon: '⭐', unlocked: user.xp >= 500 },
    { title: 'Streak Champion', description: '7 day streak', icon: '🔥', unlocked: user.streak >= 7 },
    { title: 'Perfect Score', description: 'Get 100% on a lesson', icon: '💯', unlocked: lessons.some(l => l.progress === 100) },
    { title: 'Dedicated Learner', description: 'Complete 10 lessons', icon: '🏆', unlocked: stats.completedLessons >= 10 }
  ]

  const handleLearningStyleChange = (style) => {
    updateLearningStyle(style)
  }

  const handlePreferenceChange = (key, value) => {
    updatePreferences({ [key]: value })
  }

  const getLevelProgress = () => {
    const xpForNextLevel = user.level * 100
    const currentLevelXP = (user.level - 1) * 100
    const progress = ((user.xp - currentLevelXP) / (xpForNextLevel - currentLevelXP)) * 100
    return Math.min(progress, 100)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-kiwi-dark">My Profile</h1>
        <p className="text-lg text-kiwi-gray">Track your progress and customize your learning experience</p>
      </div>

      {/* Profile Header */}
      <div className="card">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-kiwi-green rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-kiwi-dark mb-2">{user.name}</h2>
            <div className="flex items-center space-x-4 text-kiwi-gray">
              <span className="flex items-center space-x-1">
                <Zap className="w-4 h-4" />
                <span>Level {user.level}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Trophy className="w-4 h-4" />
                <span>{user.xp} XP</span>
              </span>
              <span className="flex items-center space-x-1">
                <Flame className="w-4 h-4" />
                <span>{user.streak} day streak</span>
              </span>
            </div>
            
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-kiwi-gray">Level Progress</span>
                <span className="font-semibold text-kiwi-dark">{getLevelProgress().toFixed(0)}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${getLevelProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-kiwi-light-gray rounded-xl p-1">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'achievements', label: 'Achievements', icon: Award },
          { id: 'preferences', label: 'Preferences', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-kiwi-green shadow-md'
                  : 'text-kiwi-gray hover:text-kiwi-dark'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card text-center">
            <Trophy className="w-12 h-12 text-kiwi-yellow mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-kiwi-dark">{stats.totalXP}</h3>
            <p className="text-kiwi-gray">Total XP Earned</p>
          </div>
          
          <div className="card text-center">
            <Award className="w-12 h-12 text-kiwi-green mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-kiwi-dark">{stats.completedLessons}</h3>
            <p className="text-kiwi-gray">Lessons Completed</p>
          </div>
          
          <div className="card text-center">
            <Flame className="w-12 h-12 text-orange-500 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-kiwi-dark">{user.streak}</h3>
            <p className="text-kiwi-gray">Current Streak</p>
          </div>
          
          <div className="card text-center">
            <Zap className="w-12 h-12 text-kiwi-blue mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-kiwi-dark">{stats.averageScore}%</h3>
            <p className="text-kiwi-gray">Average Score</p>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className={`card p-6 text-center transition-all ${
                achievement.unlocked
                  ? 'border-2 border-kiwi-green bg-kiwi-green bg-opacity-5'
                  : 'opacity-50 grayscale'
              }`}
            >
              <div className="text-4xl mb-3">{achievement.icon}</div>
              <h3 className="font-bold text-kiwi-dark mb-2">{achievement.title}</h3>
              <p className="text-sm text-kiwi-gray mb-3">{achievement.description}</p>
              {achievement.unlocked && (
                <div className="inline-flex items-center space-x-1 text-kiwi-green font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Unlocked</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Learning Style */}
          <div className="card">
            <h3 className="text-xl font-bold text-kiwi-dark mb-4">Learning Style</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleLearningStyleChange('gamified')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  user.learningStyle === 'gamified'
                    ? 'border-kiwi-green bg-kiwi-green bg-opacity-10'
                    : 'border-kiwi-gray hover:border-kiwi-green'
                }`}
              >
                <Gamepad2 className="w-12 h-12 text-kiwi-green mx-auto mb-3" />
                <h4 className="font-bold text-kiwi-dark mb-2">Gamified Learning</h4>
                <p className="text-sm text-kiwi-gray">
                  Interactive exercises, quizzes, and challenges with rewards
                </p>
              </button>
              
              <button
                onClick={() => handleLearningStyleChange('audiobook')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  user.learningStyle === 'audiobook'
                    ? 'border-kiwi-purple bg-kiwi-purple bg-opacity-10'
                    : 'border-kiwi-gray hover:border-kiwi-purple'
                }`}
              >
                <Headphones className="w-12 h-12 text-kiwi-purple mx-auto mb-3" />
                <h4 className="font-bold text-kiwi-dark mb-2">Audiobook Mode</h4>
                <p className="text-sm text-kiwi-gray">
                  Listen to content with text-to-speech for auditory learning
                </p>
              </button>
            </div>
          </div>

          {/* Experience Settings */}
          <div className="card">
            <h3 className="text-xl font-bold text-kiwi-dark mb-4">Experience Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-kiwi-gray" />
                  <div>
                    <p className="font-semibold text-kiwi-dark">Sound Effects</p>
                    <p className="text-sm text-kiwi-gray">Play sounds for achievements and interactions</p>
                  </div>
                </div>
                <button
                  onClick={() => handlePreferenceChange('soundEffects', !user.preferences.soundEffects)}
                  className={`w-12 h-6 rounded-full transition-all ${
                    user.preferences.soundEffects ? 'bg-kiwi-green' : 'bg-kiwi-gray'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-all transform ${
                    user.preferences.soundEffects ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-kiwi-gray" />
                  <div>
                    <p className="font-semibold text-kiwi-dark">Animations</p>
                    <p className="text-sm text-kiwi-gray">Enable UI animations and transitions</p>
                  </div>
                </div>
                <button
                  onClick={() => handlePreferenceChange('animations', !user.preferences.animations)}
                  className={`w-12 h-6 rounded-full transition-all ${
                    user.preferences.animations ? 'bg-kiwi-green' : 'bg-kiwi-gray'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-all transform ${
                    user.preferences.animations ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-5 h-5 text-kiwi-gray" />
                  <div>
                    <p className="font-semibold text-kiwi-dark">Difficulty</p>
                    <p className="text-sm text-kiwi-gray">Set your preferred difficulty level</p>
                  </div>
                </div>
                <select
                  value={user.preferences.difficulty}
                  onChange={(e) => handlePreferenceChange('difficulty', e.target.value)}
                  className="px-4 py-2 border-2 border-kiwi-gray rounded-lg focus:border-kiwi-green focus:outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
