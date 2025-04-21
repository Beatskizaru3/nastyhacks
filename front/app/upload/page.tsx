'use client'

import { FileForm } from '../../components/FileForm'

export default function UploadPage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Загрузить новый файл</h1>
      <FileForm />
    </main>
  )
}
