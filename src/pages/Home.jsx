import React from 'react'
import { Link } from 'react-router-dom'
import { Bird, BookOpen, Trophy, Zap, Headphones, Gamepad2, Upload } from 'lucide-react'
import { useUser } from '../contexts/UserContext'

const Home = () => {
  const { user } = useUser()

  const features = [
    {
      icon: Upload,
      title: 'Upload Documents',
      description: 'Upload PDFs, Word documents, and text files to transform into interactive lessons',
      color: 'text-kiwi-blue'
    },
    {
      icon: Gamepad2,
      title: 'Gamified Learning',
      description: 'Learn through interactive exercises, quizzes, and challenges with XP rewards',
      color: 'text-kiwi-green'
    },
    {
      icon: Headphones,
      title: 'Audiobook Mode',
      description: 'Listen to your documents converted to natural-sounding audio for auditory learning',
      color: 'text-kiwi-purple'
    }
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Bird className="w-24 h-24 text-kiwi-green animate-float" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-kiwi-yellow rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          <span className="text-kiwi-green">Wren</span>
          <span className="text-kiwi-blue">Learn</span>
        </h1>
        
        <p className="text-xl text-kiwi-gray mb-8 max-w-2xl mx-auto">
          Transform your documents into gamified learning adventures! 
          Upload PDFs and study materials to create interactive lessons and audiobooks.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/upload" className="btn-primary text-lg">
            Get Started
          </Link>
          <Link to="/lessons" className="btn-outline text-lg">
            Browse Lessons
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <Trophy className="w-12 h-12 text-kiwi-yellow mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-kiwi-dark">{user.xp} XP</h3>
          <p className="text-kiwi-gray">Total Experience</p>
        </div>
        
        <div className="card text-center">
          <div className="text-4xl mb-3">🔥</div>
          <h3 className="text-2xl font-bold text-kiwi-dark">{user.streak} Days</h3>
          <p className="text-kiwi-gray">Current Streak</p>
        </div>
        
        <div className="card text-center">
          <Zap className="w-12 h-12 text-kiwi-purple mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-kiwi-dark">Level {user.level}</h3>
          <p className="text-kiwi-gray">Current Level</p>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8 text-kiwi-dark">
          How Kiwi Learn Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="card text-center group">
                <Icon className={`w-16 h-16 mx-auto mb-4 ${feature.color} group-hover:scale-110 transition-transform`} />
                <h3 className="text-xl font-bold mb-3 text-kiwi-dark">
                  {feature.title}
                </h3>
                <p className="text-kiwi-gray">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Learning Style Section */}
      <section className="card">
        <h2 className="text-2xl font-bold mb-6 text-kiwi-dark">
          Choose Your Learning Style
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-kiwi-green rounded-xl p-6 hover:bg-kiwi-green hover:bg-opacity-10 transition-all cursor-pointer">
            <Gamepad2 className="w-12 h-12 text-kiwi-green mb-4" />
            <h3 className="text-xl font-bold mb-2 text-kiwi-dark">Gamified Learning</h3>
            <p className="text-kiwi-gray mb-4">
              Interactive exercises, quizzes, and challenges with points, streaks, and achievements.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="achievement-badge">Interactive</span>
              <span className="achievement-badge">Rewards</span>
              <span className="achievement-badge">Fun</span>
            </div>
          </div>
          
          <div className="border-2 border-kiwi-purple rounded-xl p-6 hover:bg-kiwi-purple hover:bg-opacity-10 transition-all cursor-pointer">
            <Headphones className="w-12 h-12 text-kiwi-purple mb-4" />
            <h3 className="text-xl font-bold mb-2 text-kiwi-dark">Audiobook Mode</h3>
            <p className="text-kiwi-gray mb-4">
              Listen to your documents converted to natural-sounding audio for auditory learning.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="achievement-badge">Audio</span>
              <span className="achievement-badge">Hands-free</span>
              <span className="achievement-badge">Accessible</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-12 bg-gradient-to-r from-kiwi-green to-kiwi-blue rounded-2xl text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Transform Your Learning?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Upload your first document and start your gamified learning journey today!
        </p>
        <Link to="/upload" className="bg-white text-kiwi-green hover:bg-gray-100 font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105">
          Start Learning Now
        </Link>
      </section>
    </div>
  )
}

export default Home
