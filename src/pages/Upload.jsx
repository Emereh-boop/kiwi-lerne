import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import { useDocuments } from '../contexts/DocumentContext'
import { useUser } from '../contexts/UserContext'
import toast from 'react-hot-toast'
import { extractPDFText, extractDocxText, extractPlainText } from '../lib/parser'

const UploadPage = () => {
  const { addDocument, generateLessons, documents } = useDocuments()
  const { addXP } = useUser()
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [processing, setProcessing] = useState(false)

  const processFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          let content = ''

          if (file.type === 'application/pdf') {
            const buffer = e.target.result
            content = await extractPDFText(buffer)
          } else if (
            file.type.includes('word') || file.name.toLowerCase().endsWith('.docx')
          ) {
            const buffer = e.target.result
            content = await extractDocxText(buffer)
          } else if (file.type.startsWith('text/')) {
            const text = typeof e.target.result === 'string' ? e.target.result : new TextDecoder().decode(e.target.result)
            content = extractPlainText(text)
          } else {
            throw new Error('Unsupported file type')
          }

          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            content: content.substring(0, 50000), // Limit content size to 50k chars
            uploadedAt: new Date().toISOString()
          })
        } catch (error) {
          reject(error)
        }
      }

      if (file.type.startsWith('text/')) {
        reader.readAsText(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    })
  }

  // Legacy placeholder extractors removed; using robust parser module

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true)
    
    try {
      const newFiles = []
      
      for (const file of acceptedFiles) {
        try {
          const processedFile = await processFile(file)
          const document = await addDocument({
            ...processedFile,
            file: file
          })
          newFiles.push({ name: file.name, id: document.id, status: 'success' })
          
          toast.success(`${file.name} uploaded successfully!`)
        } catch (error) {
          newFiles.push({ 
            name: file.name, 
            status: 'error', 
            error: error.message 
          })
          toast.error(`Failed to upload ${file.name}`)
        }
      }
      
      setUploadedFiles(prev => [...newFiles, ...prev])
      
      const successfulUploads = newFiles.filter(file => file.status === 'success')
      addXP(successfulUploads.length * 10)
      
    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }, [addDocument, addXP])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    multiple: true,
    disabled: uploading
  })

  const processDocuments = async () => {
    setProcessing(true)
    
    try {
      const successfulUploads = uploadedFiles.filter(f => f.status === 'success')
      
      for (const file of successfulUploads) {
        await generateLessons(file.id)
        toast.success(`Lessons generated for ${file.name}`)
      }
      
      addXP(successfulUploads.length * 25)
      toast.success(`${successfulUploads.length} documents processed!`)
      
    } catch (error) {
      toast.error('Failed to process some documents: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setUploadedFiles([])
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-kiwi-dark">
          Upload Documents
        </h1>
        <p className="text-lg text-kiwi-gray">
          Transform your PDFs, Word documents, and text files into interactive lessons
        </p>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div
          {...getRootProps()}
          className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-kiwi-green bg-kiwi-green bg-opacity-10'
              : 'border-kiwi-gray hover:border-kiwi-green hover:bg-kiwi-light-gray'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="space-y-4">
              <Loader2 className="w-16 h-16 text-kiwi-green mx-auto animate-spin" />
              <p className="text-lg font-semibold text-kiwi-dark">Uploading files...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-16 h-16 text-kiwi-green mx-auto" />
              <div>
                <p className="text-lg font-semibold text-kiwi-dark mb-2">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-kiwi-gray">or click to browse</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-sm text-kiwi-gray">
                <span className="px-3 py-1 bg-kiwi-light-gray rounded-full">PDF</span>
                <span className="px-3 py-1 bg-kiwi-light-gray rounded-full">DOCX</span>
                <span className="px-3 py-1 bg-kiwi-light-gray rounded-full">TXT</span>
                <span className="px-3 py-1 bg-kiwi-light-gray rounded-full">MD</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-kiwi-dark">Uploaded Files</h2>
            <button
              onClick={clearAll}
              className="text-kiwi-red hover:text-kiwi-red font-semibold"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-kiwi-light-gray rounded-lg">
                <div className="flex items-center space-x-3">
                  {file.status === 'success' ? (
                    <CheckCircle className="w-6 h-6 text-kiwi-green" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-kiwi-red" />
                  )}
                  <FileText className="w-6 h-6 text-kiwi-gray" />
                  <div>
                    <p className="font-semibold text-kiwi-dark">{file.name}</p>
                    {file.error && (
                      <p className="text-sm text-kiwi-red">{file.error}</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(index)}
                  className="text-kiwi-gray hover:text-kiwi-red"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {uploadedFiles.some(f => f.status === 'success') && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={processDocuments}
                disabled={processing}
                className="btn-primary"
              >
                {processing ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Generate Lessons'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-kiwi-dark">How it works</h2>
        <ol className="space-y-3 text-kiwi-gray">
          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-8 h-8 bg-kiwi-green text-white rounded-full flex items-center justify-center font-bold">1</span>
            <span>Upload your PDF, Word, or text documents</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-8 h-8 bg-kiwi-green text-white rounded-full flex items-center justify-center font-bold">2</span>
            <span>Our system extracts and analyzes the content</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-8 h-8 bg-kiwi-green text-white rounded-full flex items-center justify-center font-bold">3</span>
            <span>Interactive lessons are automatically generated</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-8 h-8 bg-kiwi-green text-white rounded-full flex items-center justify-center font-bold">4</span>
            <span>Start learning with gamified exercises or audiobook mode</span>
          </li>
        </ol>
      </div>
    </div>
  )
}

export default UploadPage
