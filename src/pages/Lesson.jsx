import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Volume2, Headphones, BookOpen, RotateCcw } from 'lucide-react'
import { useDocuments } from '../contexts/DocumentContext'
import { useUser } from '../contexts/UserContext'
import { lessonsAPI } from '../lib/api'
import toast from 'react-hot-toast'

const Lesson = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lessons, updateLessonProgress, completeLesson } = useDocuments()
  const { user, addXP, addAchievement } = useUser()
  
  const [lesson, setLesson] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [isAudiobookMode, setIsAudiobookMode] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState([])
  const [voiceName, setVoiceName] = useState(localStorage.getItem('wren_tts_voice') || '')
  const [rate, setRate] = useState(parseFloat(localStorage.getItem('wren_tts_rate') || '0.9'))
  const [pitch, setPitch] = useState(parseFloat(localStorage.getItem('wren_tts_pitch') || '1'))
  const [currentPara, setCurrentPara] = useState(0)

  useEffect(() => {
    const loadLesson = async () => {
      const foundLesson = lessons.find(l => l.id === id)
      if (foundLesson) {
        setLesson(foundLesson)
        if (user.learningStyle === 'audiobook') {
          setIsAudiobookMode(true)
        }
        return
      }

      try {
        const data = await lessonsAPI.getById(id)
        const payload = data.lesson.payload || {}
        setLesson({
          ...data.lesson,
          ...payload,
          documentId: data.lesson.documentId || data.lesson.document_id,
          words: payload.words || data.lesson.words || [],
          items: payload.items || data.lesson.items || [],
          questions: payload.questions || data.lesson.questions || [],
          summary: payload.summary || data.lesson.summary || '',
          payload
        })
        if (user.learningStyle === 'audiobook') {
          setIsAudiobookMode(true)
        }
      } catch (error) {
        console.error('Failed to load lesson:', error)
        navigate('/lessons')
      }
    }

    if (id) {
      loadLesson()
    }
  }, [id, lessons, navigate, user.learningStyle])

  // Load available voices for TTS
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const loadVoices = () => {
      const vs = window.speechSynthesis.getVoices()
      setVoices(vs)
      if (!voiceName && vs.length) {
        // Prefer an English voice by default if available
        const preferred = vs.find(v => /en-/i.test(v.lang)) || vs[0]
        setVoiceName(preferred.name)
      }
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [voiceName])

  if (!lesson) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kiwi-green mx-auto mb-4"></div>
          <p className="text-kiwi-gray">Loading lesson...</p>
        </div>
      </div>
    )
  }

  const handleAnswerSelect = (answerIndex) => {
    if (showResult) return
    setSelectedAnswer(answerIndex)
  }

  // Cloze lesson UI
  if (lesson.type === 'cloze') {
    const item = lesson.items[currentQuestion]
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/lessons')}
            className="flex items-center space-x-2 text-kiwi-gray hover:text-kiwi-green"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Lessons</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-kiwi-gray">Item:</span>
            <span className="font-semibold text-kiwi-dark">{currentQuestion + 1}/{lesson.items.length}</span>
          </div>
        </div>

        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-kiwi-dark mb-2">{lesson.title}</h1>
            <p className="text-kiwi-gray">{lesson.description}</p>
          </div>

          <div className="bg-kiwi-light-gray rounded-xl p-6 mb-6 text-lg">
            {item.sentence}
          </div>

          <div className="space-y-3">
            {item.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  showResult
                    ? option === item.answer
                      ? 'border-kiwi-green bg-kiwi-green bg-opacity-10'
                      : index === selectedAnswer
                      ? 'border-kiwi-red bg-kiwi-red bg-opacity-10'
                      : 'border-kiwi-gray opacity-50'
                    : selectedAnswer === index
                    ? 'border-kiwi-green bg-kiwi-green bg-opacity-10'
                    : 'border-kiwi-gray hover:border-kiwi-green hover:bg-kiwi-light-gray'
                }`}
              >
                <span className="font-medium text-kiwi-dark">{option}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-center space-x-4 mt-6">
            {!showResult ? (
              <button
                onClick={() => {
                  if (selectedAnswer === null) return
                  setShowResult(true)
                  const isCorrect = item.options[selectedAnswer] === item.answer
                  if (isCorrect) {
                    setScore(score + 1)
                    toast.success('Correct! +10 XP')
                    addXP(10)
                  } else {
                    toast.error('Not quite right. Try again!')
                  }
                }}
                disabled={selectedAnswer === null}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={() => {
                  if (currentQuestion < lesson.items.length - 1) {
                    setCurrentQuestion(currentQuestion + 1)
                    setSelectedAnswer(null)
                    setShowResult(false)
                  } else {
                    handleLessonComplete()
                  }
                }}
                className="btn-primary"
              >
                {currentQuestion < lesson.items.length - 1 ? 'Next' : 'Complete Lesson'}
              </button>
            )}

            {showResult && (
              <button
                onClick={() => {
                  setSelectedAnswer(null)
                  setShowResult(false)
                }}
                className="btn-secondary"
              >
                Try Again
              </button>
            )}
          </div>
        </div>

        <div className="text-center text-kiwi-gray">
          <p>Score: {score}/{lesson.items.length}</p>
        </div>
      </div>
    )
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    
    setShowResult(true)
    
    const isCorrect = lesson.questions[currentQuestion].correct === selectedAnswer
    if (isCorrect) {
      setScore(score + 1)
      toast.success('Correct! +10 XP')
      addXP(10)
    } else {
      toast.error('Not quite right. Try again!')
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion < lesson.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      handleLessonComplete()
    }
  }

  const handleLessonComplete = () => {
    const totalItems = lesson.questions?.length || lesson.items?.length || lesson.words?.length || 1
    const finalScore = lesson.questions || lesson.items
      ? Math.round((score / totalItems) * 100)
      : 100

    updateLessonProgress(lesson.id, finalScore)
    
    if (finalScore >= 80) {
      completeLesson(lesson.id)
      addXP(lesson.xp)
      addAchievement({
        title: `Completed ${lesson.title}`,
        description: `Score: ${finalScore}%`,
        earnedAt: new Date().toISOString()
      })
      toast.success(`Lesson completed! +${lesson.xp} XP`)
    }
    
    navigate('/lessons')
  }

  const toggleAudiobookMode = () => {
    setIsAudiobookMode(!isAudiobookMode)
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = Math.min(2, Math.max(0.5, rate))
      utterance.pitch = Math.min(2, Math.max(0, pitch))
      utterance.volume = 1
      const selected = voices.find(v => v.name === voiceName)
      if (selected) utterance.voice = selected
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      
      window.speechSynthesis.speak(utterance)
    } else {
      toast.error('Text-to-speech not supported in your browser')
    }
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const pauseSpeaking = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      setIsSpeaking(false)
    }
  }

  const resumeSpeaking = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setIsSpeaking(true)
    }
  }

  const getParagraphs = () => {
    if (!lesson) return []
    // Split summary into paragraphs by double newline, fallback to sentence chunks
    const raw = (lesson.summary || '').split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    if (raw.length > 0) return raw
    return (lesson.summary || '').split(/(?<=[.!?])\s+/).reduce((acc, s, i) => {
      const last = acc[acc.length - 1]
      if (!last || last.join(' ').length > 220) acc.push([s])
      else last.push(s)
      return acc
    }, []).map(chunk => chunk.join(' '))
  }

  const paragraphs = getParagraphs()

  const speakParagraph = (idx) => {
    const i = Math.max(0, Math.min(idx, paragraphs.length - 1))
    setCurrentPara(i)
    if (paragraphs[i]) speakText(paragraphs[i])
  }

  if (isAudiobookMode && lesson.type === 'summary') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/lessons')}
            className="flex items-center space-x-2 text-kiwi-gray hover:text-kiwi-green"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Lessons</span>
          </button>
          
          <button
            onClick={toggleAudiobookMode}
            className="flex items-center space-x-2 px-4 py-2 bg-kiwi-purple text-white rounded-lg hover:bg-kiwi-purple hover:bg-opacity-80"
          >
            <BookOpen className="w-5 h-5" />
            <span>Switch to Reading</span>
          </button>
        </div>

        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-kiwi-dark mb-2">{lesson.title}</h1>
            <p className="text-kiwi-gray">{lesson.description}</p>
          </div>

          {/* Audio Controls */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-kiwi-dark mb-1">Voice</label>
              <select
                value={voiceName}
                onChange={(e) => {
                  setVoiceName(e.target.value)
                  localStorage.setItem('wren_tts_voice', e.target.value)
                }}
                className="w-full px-3 py-2 border-2 border-kiwi-gray rounded-lg focus:border-kiwi-green focus:outline-none"
              >
                {voices.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-kiwi-dark mb-1">Speed ({rate.toFixed(1)}x)</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  setRate(val)
                  localStorage.setItem('wren_tts_rate', String(val))
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-kiwi-dark mb-1">Pitch ({pitch.toFixed(1)})</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  setPitch(val)
                  localStorage.setItem('wren_tts_pitch', String(val))
                }}
                className="w-full"
              />
            </div>
          </div>

          <div className="prose max-w-none">
            <div className="bg-kiwi-light-gray rounded-xl p-8 text-lg leading-relaxed text-kiwi-dark">
              {lesson.summary}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => speakParagraph(currentPara)}
                className="btn-primary flex items-center space-x-2"
              >
                <Headphones className="w-5 h-5" />
                <span>{isSpeaking ? 'Restart Paragraph' : 'Play Paragraph'}</span>
              </button>

              <button
                onClick={pauseSpeaking}
                className="btn-outline"
              >
                Pause
              </button>

              <button
                onClick={resumeSpeaking}
                className="btn-outline"
              >
                Resume
              </button>

              <button
                onClick={stopSpeaking}
                className="btn-secondary"
              >
                Stop
              </button>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => speakParagraph(currentPara - 1)}
                className="btn-outline"
                disabled={currentPara <= 0}
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-kiwi-dark">
                Paragraph {currentPara + 1} / {paragraphs.length}
              </span>
              <button
                onClick={() => speakParagraph(currentPara + 1)}
                className="btn-outline"
                disabled={currentPara >= paragraphs.length - 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => handleLessonComplete()}
            className="btn-primary"
          >
            Mark as Complete
          </button>
        </div>
      </div>
    )
  }

  if (lesson.type === 'vocabulary') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/lessons')}
            className="flex items-center space-x-2 text-kiwi-gray hover:text-kiwi-green"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Lessons</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-kiwi-gray">Progress:</span>
            <div className="w-32 progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentQuestion + 1) / lesson.words.length) * 100}%` }}
              ></div>
            </div>
            <span className="font-semibold text-kiwi-dark">
              {currentQuestion + 1}/{lesson.words.length}
            </span>
          </div>
        </div>

        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-kiwi-dark mb-2">{lesson.title}</h1>
            <p className="text-kiwi-gray">{lesson.description}</p>
          </div>

          <div className="text-center">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-kiwi-green mb-4">
                {lesson.words[currentQuestion]}
              </h2>
              <p className="text-lg text-kiwi-gray mb-6">
                Study this word and click next when you're ready to continue.
              </p>
              
              <button
                onClick={() => speakText(lesson.words[currentQuestion])}
                className="btn-secondary mb-6"
              >
                <Volume2 className="w-5 h-5 inline mr-2" />
                Hear Pronunciation
              </button>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  if (currentQuestion < lesson.words.length - 1) {
                    setCurrentQuestion(currentQuestion + 1)
                  } else {
                    handleLessonComplete()
                  }
                }}
                className="btn-primary"
              >
                {currentQuestion < lesson.words.length - 1 ? 'Next Word' : 'Complete Lesson'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (lesson.type === 'summary') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/lessons')}
            className="flex items-center space-x-2 text-kiwi-gray hover:text-kiwi-green"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Lessons</span>
          </button>
          <button
            onClick={toggleAudiobookMode}
            className="btn-secondary"
          >
            {isAudiobookMode ? 'Switch to Reading' : 'Switch to Audiobook Mode'}
          </button>
        </div>

        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-kiwi-dark mb-2">{lesson.title}</h1>
            <p className="text-kiwi-gray">{lesson.description}</p>
          </div>

          <div className="prose max-w-none">
            <div className="bg-kiwi-light-gray rounded-xl p-8 text-lg leading-relaxed text-kiwi-dark">
              {lesson.summary}
            </div>
          </div>

          {isAudiobookMode && (
            <div className="mt-8 space-y-4">
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => speakParagraph(currentPara)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Headphones className="w-5 h-5" />
                  <span>{isSpeaking ? 'Restart Paragraph' : 'Play Paragraph'}</span>
                </button>
                <button onClick={pauseSpeaking} className="btn-outline">Pause</button>
                <button onClick={resumeSpeaking} className="btn-outline">Resume</button>
                <button onClick={stopSpeaking} className="btn-secondary">Stop</button>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => speakParagraph(currentPara - 1)}
                  className="btn-outline"
                  disabled={currentPara <= 0}
                >
                  Previous
                </button>
                <span className="text-sm font-semibold text-kiwi-dark">
                  Paragraph {currentPara + 1} / {paragraphs.length}
                </span>
                <button
                  onClick={() => speakParagraph(currentPara + 1)}
                  className="btn-outline"
                  disabled={currentPara >= paragraphs.length - 1}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => handleLessonComplete()}
            className="btn-primary"
          >
            Mark as Complete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/lessons')}
          className="flex items-center space-x-2 text-kiwi-gray hover:text-kiwi-green"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Lessons</span>
        </button>
        
        <div className="flex items-center space-x-2">
          <span className="text-kiwi-gray">Question:</span>
          <span className="font-semibold text-kiwi-dark">
            {currentQuestion + 1}/{lesson.questions.length}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-kiwi-dark mb-2">{lesson.title}</h1>
          <p className="text-kiwi-gray">{lesson.description}</p>
        </div>

        <div className="mb-8">
          <div className="bg-kiwi-light-gray rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-kiwi-dark mb-4">
              {lesson.questions[currentQuestion].question}
            </h2>
          </div>

          <div className="space-y-3">
            {lesson.questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  showResult
                    ? index === lesson.questions[currentQuestion].correct
                      ? 'border-kiwi-green bg-kiwi-green bg-opacity-10'
                      : index === selectedAnswer
                      ? 'border-kiwi-red bg-kiwi-red bg-opacity-10'
                      : 'border-kiwi-gray opacity-50'
                    : selectedAnswer === index
                    ? 'border-kiwi-green bg-kiwi-green bg-opacity-10'
                    : 'border-kiwi-gray hover:border-kiwi-green hover:bg-kiwi-light-gray'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-kiwi-dark">{option}</span>
                  {showResult && index === lesson.questions[currentQuestion].correct && (
                    <CheckCircle className="w-6 h-6 text-kiwi-green" />
                  )}
                  {showResult && index === selectedAnswer && index !== lesson.questions[currentQuestion].correct && (
                    <XCircle className="w-6 h-6 text-kiwi-red" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          {!showResult ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="btn-primary"
            >
              {currentQuestion < lesson.questions.length - 1 ? 'Next Question' : 'Complete Lesson'}
            </button>
          )}
          
          {showResult && (
            <button
              onClick={() => {
                setSelectedAnswer(null)
                setShowResult(false)
              }}
              className="btn-secondary flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          )}
        </div>
      </div>

      <div className="text-center text-kiwi-gray">
        <p>Score: {score}/{lesson.questions.length}</p>
      </div>
    </div>
  )
}

export default Lesson
