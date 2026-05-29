import { useState, useCallback, useRef } from 'react'

export function useAgent() {
  const [status, setStatus] = useState('idle') // idle | searching | analyzing | done | error
  const [result, setResult] = useState(null)
  const [streamText, setStreamText] = useState('')
  const [sources, setSources] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const run = useCallback(async (topic, category) => {
    setStatus('searching')
    setResult(null)
    setStreamText('')
    setSources([])
    setSearchQuery('')
    setError(null)

    abortRef.current = new AbortController()

    try {
      const response = await fetch('/api/agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, category }),
        signal: abortRef.current.signal
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Помилка сервера')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const dataStr = line.slice(6).trim()
          if (!dataStr) continue

          try {
            const data = JSON.parse(dataStr)

            if (data.type === 'sources') {
              setSources(data.sources || [])
              setSearchQuery(data.query || '')
              setStatus('analyzing')
            } else if (data.type === 'token') {
              fullText += data.content
              setStreamText(fullText)
            } else if (data.type === 'done') {
              setResult(fullText)
              setStatus('done')
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }

      if (status !== 'done') {
        setResult(fullText)
        setStatus('done')
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('idle')
      } else {
        setError(err.message)
        setStatus('error')
      }
    }
  }, [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setStatus('idle')
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setStatus('idle')
    setResult(null)
    setStreamText('')
    setSources([])
    setSearchQuery('')
    setError(null)
  }, [])

  return { status, result, streamText, sources, searchQuery, error, run, cancel, reset }
}