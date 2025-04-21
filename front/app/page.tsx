'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'                  // ← вот это было упущено
import { getFiles, FileData } from '../utils/api'
import { FileItem } from '../components/FileItem'

export default function HomePage() {
  const [files, setFiles] = useState<FileData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getFiles()
      .then(setFiles)
      .catch(e => setError(e.message))
  }, [])

  return (
    <main className="container mx-auto p-4">
      {/* Заголовок и навигация */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Список файлов</h1>
        <div className="flex gap-4">
          <Link href="/login" className="underline text-blue-600">
            Вход для админа
          </Link>
          <Link href="/upload" className="underline text-blue-600">
            Загрузить новый
          </Link>
        </div>
      </div>

      {/* Ошибка */}
      {error && <p className="text-red-500 mb-4">Ошибка: {error}</p>}

      {/* Сетка файлов */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {files.map(file => (
          <FileItem key={file.id} file={file} />
        ))}
      </div>
    </main>
  )
}
