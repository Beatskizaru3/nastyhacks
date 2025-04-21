// front/components/FileForm.tsx
'use client'

import React, { useState, FormEvent } from 'react'
import { uploadFile } from '../utils/api'

export function FileForm() {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [filename, setFilename] = useState('')
  const [youtubeLink, setYoutubeLink] = useState('')
  const [preview, setPreview] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Выберите файл')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('filename', filename)
    formData.append('description', description)
    formData.append('youtube_link', youtubeLink)
    if (preview) formData.append('preview_image', preview)

    try {
      await uploadFile(formData)
      setSuccess(true)
      setError(null)
      setFile(null)
      setFilename('')
      setDescription('')
      setYoutubeLink('')
      setPreview(null)
    } catch (e: any) {
      setError(e.message)
      setSuccess(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 border rounded">
      {/* поля формы */}
    </form>
  )
}
