import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Trophy, Clock, CheckCircle, Lock, Star, Filter } from 'lucide-react'
import { useDocuments } from '../contexts/DocumentContext'
import { useUser } from '../contexts/UserContext'

const Lessons = () => {
  const { lessons, documents } = useDocuments()
  const { user } = useUser()
  const [filter, setFilter] = useState('all')

  const filteredLessons = lessons.filter(lesson => {
    if (filter === 'all') return true
    if (filter === 'completed') return lesson.completed
    if (filter === 'incomplete') return !lesson.completed
    if (filter === 'vocabulary') return lesson.type === 'vocabulary'
    if (filter === 'comprehension') return lesson.type === 'comprehension'
    if (filter === 'summary') return lesson.type === 'summary'
    return true
  })

  const getDocumentName = (documentId) => {
    const doc = documents.find(d => d.id === documentId)
    return doc ? doc.name : 'Unknown Document'
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-kiwi-green'
      case 'medium': return 'text-kiwi-yellow'
      case 'hard': return 'text-kiwi-red'
      default: return 'text-kiwi-gray'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'vocabulary': return '📝'
      case 'cloze': return '🧩'
      case 'comprehension': return '🧠'
      case 'summary': return '📋'
      default: return '📚'
    }
  }

  const stats = {
    total: lessons.length,
    completed: lessons.filter(l => l.completed).length,
    totalXP: lessons.reduce((acc, l) => acc + (l.completed ? l.xp : 0), 0)
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-kiwi-dark">
          Your Lessons
        </h1>
        <p className="text-lg text-kiwi-gray">
          Continue your learning journey with interactive lessons
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <BookOpen className="w-12 h-12 text-kiwi-blue mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-kiwi-dark">{stats.total}</h3>
          <p className="text-kiwi-gray">Total Lessons</p>
        </div>
        
        <div className="card text-center">
          <CheckCircle className="w-12 h-12 text-kiwi-green mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-kiwi-dark">{stats.completed}</h3>
          <p className="text-kiwi-gray">Completed</p>
        </div>
        
        <div className="card text-center">
          <Trophy className="w-12 h-12 text-kiwi-yellow mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-kiwi-dark">{stats.totalXP}</h3>
          <p className="text-kiwi-gray">XP Earned</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-kiwi-gray" />
          <span className="font-semibold text-kiwi-dark">Filter:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All Lessons' },
            { value: 'incomplete', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'vocabulary', label: 'Vocabulary' },
            { value: 'comprehension', label: 'Comprehension' },
            { value: 'summary', label: 'Summary' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === option.value
                  ? 'bg-kiwi-green text-white'
                  : 'bg-kiwi-light-gray text-kiwi-gray hover:bg-kiwi-gray hover:bg-opacity-20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <div key={lesson.id} className="lesson-card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getTypeIcon(lesson.type)}</span>
                  <div>
                    <h3 className="font-bold text-kiwi-dark">{lesson.title}</h3>
                    <p className="text-sm text-kiwi-gray">
                      {getDocumentName(lesson.documentId)}
                    </p>
                  </div>
                </div>
                
                {lesson.completed ? (
                  <CheckCircle className="w-6 h-6 text-kiwi-green" />
                ) : (
                  <Lock className="w-6 h-6 text-kiwi-gray" />
                )}
              </div>

              <p className="text-kiwi-gray mb-4 text-sm">
                {lesson.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-semibold ${getDifficultyColor(lesson.difficulty)}`}>
                    {lesson.difficulty}
                  </span>
                  <span className="text-sm text-kiwi-gray">•</span>
                  <div className="flex items-center space-x-1">
                    <Trophy className="w-4 h-4 text-kiwi-yellow" />
                    <span className="text-sm font-semibold text-kiwi-dark">{lesson.xp} XP</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-kiwi-gray">Progress</span>
                  <span className="font-semibold text-kiwi-dark">{lesson.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${lesson.progress}%` }}
                  ></div>
                </div>
              </div>

              <Link to={`/lesson/${lesson.id}`}>
                <button className={`w-full py-3 rounded-lg font-bold transition-all ${
                  lesson.completed
                    ? 'bg-kiwi-light-gray text-kiwi-gray hover:bg-kiwi-gray hover:bg-opacity-20'
                    : 'btn-primary'
                }`}>
                  {lesson.completed ? 'Review' : 'Start Lesson'}
                </button>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <BookOpen className="w-16 h-16 text-kiwi-gray mx-auto mb-4" />
          <h3 className="text-xl font-bold text-kiwi-dark mb-2">
            No lessons found
          </h3>
          <p className="text-kiwi-gray mb-6">
            {filter === 'all' 
              ? 'Upload some documents to generate your first lessons!'
              : 'No lessons match this filter. Try a different filter!'
            }
          </p>
          {filter === 'all' && (
            <Link to="/upload" className="btn-primary">
              Upload Documents
            </Link>
          )}
        </div>
      )}

      {/* Achievement Section */}
      {stats.completed > 0 && (
        <div className="card bg-gradient-to-r from-kiwi-green to-kiwi-blue text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Great Progress! 🎉</h3>
              <p className="opacity-90">
                You've completed {stats.completed} lessons and earned {stats.totalXP} XP!
              </p>
            </div>
            <div className="text-6xl">
              <Star className="w-16 h-16 text-kiwi-yellow" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Lessons
