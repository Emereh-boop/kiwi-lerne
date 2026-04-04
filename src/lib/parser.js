// Robust client-side parsers for PDF and DOCX
// pdfjs-dist for PDFs, mammoth for DOCX. Graceful fallbacks included.

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import mammoth from 'mammoth'

// Configure pdfjs worker (Vite-friendly)
try {
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()
} catch (e) {
  // Fallback to CDN if bundler URL fails
  try {
    GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
  } catch (_) {
    // ignore
  }
}

export async function extractPDFText(arrayBuffer) {
  try {
    const loadingTask = getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const maxPages = Math.min(pdf.numPages, 50) // cap for very large PDFs
    let fullText = ''

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const content = await page.getTextContent()
      const strings = content.items.map((item) => ('str' in item ? item.str : '')).filter(Boolean)
      fullText += strings.join(' ') + '\n\n'
    }

    return sanitizeText(fullText)
  } catch (err) {
    // Fallback: decode bytes to string (better than nothing)
    try {
      return sanitizeText(new TextDecoder().decode(arrayBuffer))
    } catch (_) {
      return 'Unable to extract PDF text.'
    }
  }
}

export async function extractDocxText(arrayBuffer) {
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer })
    const html = result.value || ''
    return sanitizeText(stripHtml(html))
  } catch (err) {
    try {
      return sanitizeText(new TextDecoder().decode(arrayBuffer))
    } catch (_) {
      return 'Unable to extract DOCX text.'
    }
  }
}

export function extractPlainText(text) {
  return sanitizeText(text || '')
}

function stripHtml(html) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || tmp.innerText || '').replace(/\s+\n/g, '\n').trim()
}

function sanitizeText(text) {
  return (text || '')
    .replace(/\u0000/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim()
}
