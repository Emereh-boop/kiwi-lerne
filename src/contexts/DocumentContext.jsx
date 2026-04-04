import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { documentsAPI, lessonsAPI } from '../lib/api'

const DocumentContext = createContext()

export const useDocuments = () => {
  const context = useContext(DocumentContext)
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider')
  }
  return context
}

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([])
  const [currentDocument, setCurrentDocument] = useState(null)
  const [lessons, setLessons] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user: authUser } = useAuth()

  // Load documents and lessons from backend
  useEffect(() => {
    (async () => {
      if (!authUser) {
        setDocuments([])
        setLessons([])
        return
      }

      setLoading(true)
      try {
        const [docsData, lessonsData] = await Promise.all([
          documentsAPI.getAll(),
          lessonsAPI.getAll()
        ])
        
        setDocuments(docsData || [])
        setLessons(lessonsData || [])
      } catch (error) {
        console.error('Failed to load documents/lessons:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [authUser?.id])

  const addDocument = async (documentData) => {
    // documentData should contain: { name, content, mimeType, size }
    // For now, we'll create a File object from the content to upload
    // In a real scenario, you'd upload the original file
    try {
      // Create a blob from content for upload (or use original file if available)
      let fileToUpload = documentData.file
      
      if (!fileToUpload && documentData.content) {
        // Create a text file from content as fallback
        const blob = new Blob([documentData.content], { type: documentData.mimeType || 'text/plain' })
        fileToUpload = new File([blob], documentData.name, { type: documentData.mimeType || 'text/plain' })
      }

      if (!fileToUpload) {
        throw new Error('No file or content provided')
      }

      const uploadedDoc = await documentsAPI.upload(fileToUpload)
      
      // Store content locally for lesson generation (since backend doesn't store full content)
      const newDocument = {
        ...uploadedDoc,
        content: documentData.content, // Keep content for client-side lesson generation
        uploadedAt: uploadedDoc.uploaded_at || new Date().toISOString()
      }
      
      setDocuments(prev => [newDocument, ...prev])
      return newDocument
    } catch (error) {
      console.error('Failed to add document:', error)
      throw error
    }
  }

  const updateDocument = async (id, updates) => {
    try {
      const updated = await documentsAPI.update(id, updates)
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === id ? { ...doc, ...updated } : doc
        )
      )
      return updated
    } catch (error) {
      console.error('Failed to update document:', error)
      throw error
    }
  }

  const deleteDocument = async (id) => {
    try {
      await documentsAPI.delete(id)
      setDocuments(prev => prev.filter(doc => doc.id !== id))
      setLessons(prev => prev.filter(lesson => lesson.document_id !== id))
    } catch (error) {
      console.error('Failed to delete document:', error)
      throw error
    }
  }

  const generateLessons = async (documentId, content) => {
    const document = documents.find(doc => doc.id === documentId)
    if (!document && !content) {
      throw new Error('Document not found or content not provided')
    }

    // Use provided content or document content
    const textContent = content || document.content
    if (!textContent) {
      throw new Error('No content available for lesson generation')
    }

    // Generate lessons client-side (keep existing logic)
    const generatedLessons = generateLessonsFromContent(textContent, documentId)
    
    // Transform to backend format
    const lessonsForBackend = generatedLessons.map(lesson => ({
      type: lesson.type,
      title: lesson.title,
      description: lesson.description,
      difficulty: lesson.difficulty,
      xp: lesson.xp,
      payload: {
        words: lesson.words,
        items: lesson.items,
        questions: lesson.questions,
        summary: lesson.summary
      }
    }))

    try {
      // Save lessons to backend
      const savedLessons = await lessonsAPI.create(documentId, lessonsForBackend)
      
      // Update local state
      setLessons(prev => [...prev, ...savedLessons])
      
      // Mark document as processed
      await updateDocument(documentId, { processed: true })
      
      return savedLessons
    } catch (error) {
      console.error('Failed to save lessons:', error)
      throw error
    }
  }

  const generateLessonsFromContent = (content, documentId) => {
    const cleaned = content.replace(/\s+/g, ' ').trim()
    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 20)
    const words = cleaned.toLowerCase().match(/[a-z0-9]+/g) || []
    const lessons = []

    const stopwords = new Set(['the','and','to','of','a','in','that','is','it','for','on','as','with','are','be','by','this','an','or','from','at','was','which','but','have','has','not','can','will','its','their','more','one','we','you'])
    const freq = new Map()
    for (const w of words) {
      if (w.length < 4 || stopwords.has(w)) continue
      freq.set(w, (freq.get(w) || 0) + 1)
    }
    const keywords = Array.from(freq.entries())
      .sort((a,b) => b[1]-a[1])
      .slice(0, 20)
      .map(([w]) => w)

    // Vocabulary lesson using keywords
    if (keywords.length > 0) {
      lessons.push({
        id: `${documentId}-vocab`,
        documentId,
        type: 'vocabulary',
        title: 'Key Vocabulary',
        description: 'Learn important terms extracted from your document',
        difficulty: 'easy',
        xp: 60,
        words: keywords.slice(0, 12),
        completed: false,
        progress: 0
      })
    }

    // Cloze (fill-in-the-blank) lesson
    const clozeItems = buildClozeItems(sentences, keywords)
    if (clozeItems.length) {
      lessons.push({
        id: `${documentId}-cloze`,
        documentId,
        type: 'cloze',
        title: 'Fill in the Blanks',
        description: 'Test recall by completing sentences with key terms',
        difficulty: 'medium',
        xp: 90,
        items: clozeItems.slice(0, 8),
        completed: false,
        progress: 0
      })
    }

    // Comprehension questions
    if (sentences.length > 0) {
      lessons.push({
        id: `${documentId}-comprehension`,
        documentId,
        type: 'comprehension',
        title: 'Reading Comprehension',
        description: 'Multiple-choice questions generated from key statements',
        difficulty: 'medium',
        xp: 120,
        questions: generateComprehensionQuestions(sentences.slice(0, 8), keywords.slice(0, 6)),
        completed: false,
        progress: 0
      })
    }

    // Summary lesson
    const summary = summarizeText(sentences, keywords)
    lessons.push({
      id: `${documentId}-summary`,
      documentId,
      type: 'summary',
      title: 'Document Summary',
      description: 'Review the main points of this document',
      difficulty: 'easy',
      xp: 40,
      summary,
      completed: false,
      progress: 0
    })

    // Fallback: if no lessons were generated (e.g., tiny document), create generic lessons
    if (lessons.length === 0) {
      lessons.push({
        id: `${documentId}-summary`,
        documentId,
        type: 'summary',
        title: 'Document Summary',
        description: 'Review the main points of this document',
        difficulty: 'easy',
        xp: 40,
        summary: cleaned.substring(0, 800) || 'No content available.',
        completed: false,
        progress: 0
      })
    }

    return lessons
  }

  const generateComprehensionQuestions = (sentences, keywords) => {
    const take = Math.min(4, sentences.length)
    const selected = sentences.slice(0, take)
    return selected.map((s, idx) => {
      const focus = (keywords && keywords[idx % Math.max(1, keywords.length)]) || ''
      const stem = `What best describes this statement: "${s.trim().substring(0, 140)}"?`
      const options = [
        'Main idea of the section',
        'Supporting detail',
        'Counterpoint or limitation',
        'Irrelevant information'
      ]
      // Heuristic: longer/intro sentences marked as main idea
      const correct = s.length > 120 || idx === 0 ? 0 : 1
      return { id: `q-${idx}`, question: stem, options, correct }
    })
  }

  const buildClozeItems = (sentences, keywords) => {
    const items = []
    for (const s of sentences) {
      const lower = s.toLowerCase()
      const match = (keywords || []).find(k => lower.includes(k))
      if (!match) continue
      const blanked = s.replace(new RegExp(`\\b${escapeRegExp(match)}\\b`, 'i'), '____')
      const distractors = (keywords || []).filter(k => k !== match).slice(0,3)
      const options = shuffleArray([match, ...distractors].slice(0,4))
      items.push({ sentence: blanked, answer: match, options })
      if (items.length >= 10) break
    }
    return items
  }

  const summarizeText = (sentences, keywords) => {
    const top = sentences.slice(0, 3).join(' ')
    const key = (keywords || []).slice(0,5).join(', ')
    const base = `${top} \n\nKey terms: ${key}`
    return base.length > 800 ? base.substring(0, 800) + '…' : base
  }

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const shuffleArray = (arr) => arr.map(v => [Math.random(), v]).sort((a,b)=>a[0]-b[0]).map(([,v])=>v)

  const updateLessonProgress = async (lessonId, progress) => {
    // Optimistic update
    setLessons(prev =>
      prev.map(lesson =>
        lesson.id === lessonId
          ? { ...lesson, progress, completed: progress >= 100 }
          : lesson
      )
    )

    // Sync with backend
    try {
      await lessonsAPI.updateProgress(lessonId, {
        progress,
        completed: progress >= 100,
        score: progress
      })
    } catch (error) {
      console.error('Failed to update lesson progress:', error)
      // Could revert optimistic update here if needed
    }
  }

  const completeLesson = async (lessonId) => {
    // Optimistic update
    setLessons(prev =>
      prev.map(lesson =>
        lesson.id === lessonId
          ? { ...lesson, completed: true, progress: 100 }
          : lesson
      )
    )

    // Sync with backend
    try {
      await lessonsAPI.updateProgress(lessonId, {
        progress: 100,
        completed: true,
        score: 100
      })
    } catch (error) {
      console.error('Failed to complete lesson:', error)
    }
  }

  const value = {
    documents,
    currentDocument,
    lessons,
    currentLesson,
    loading,
    addDocument,
    updateDocument,
    deleteDocument,
    generateLessons,
    setCurrentDocument,
    setCurrentLesson,
    updateLessonProgress,
    completeLesson
  }

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  )
}
