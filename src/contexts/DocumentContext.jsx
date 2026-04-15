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

  const normalizeLesson = (lesson) => {
    if (!lesson) return lesson
    const payload = lesson.payload || {}
    return {
      ...lesson,
      ...payload,
      documentId: lesson.documentId || lesson.document_id,
      words: payload.words || lesson.words || [],
      items: payload.items || lesson.items || [],
      questions: payload.questions || lesson.questions || [],
      summary: payload.summary || lesson.summary || '',
      payload
    }
  }

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
        setLessons((lessonsData || []).map(normalizeLesson))
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

      const uploadedDoc = await documentsAPI.upload(fileToUpload, documentData.content)
      
      // Store content locally for lesson generation and future sync
      const newDocument = {
        ...uploadedDoc,
        content: documentData.content,
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

  const generateLessons = async (documentId) => {
    try {
      const savedLessons = await lessonsAPI.generateForDocument(documentId)
      const normalized = savedLessons.map(normalizeLesson)
      setLessons(prev => [...prev, ...normalized])
      await updateDocument(documentId, { processed: true })
      return normalized
    } catch (error) {
      console.error('Failed to generate lessons on server:', error)
      throw error
    }
  }

  const deleteLesson = async (lessonId) => {
    try {
      await lessonsAPI.delete(lessonId)
      setLessons(prev => prev.filter(lesson => lesson.id !== lessonId))
    } catch (error) {
      console.error('Failed to delete lesson:', error)
      throw error
    }
  }

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
    deleteLesson,
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
