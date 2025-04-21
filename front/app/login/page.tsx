'use client'

import React, { useState } from 'react'
import { loginUser } from '../../utils/api'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [files, setFiles] = useState<FileData[]>([])
  const [page, setPage] = useState(1)

  useEffect(() => {
    getFiles('date', page, 10).then(setFiles)
  }, [page])

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {files.map((f) => (
          <FileItem key={f.id} file={f} />
        ))}
      </div>

      {/* Пагинация (упрощённо) */}
      <div className="flex justify-center space-x-2 mt-6">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))}>&lt; Prev</button>
        <span>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)}>Next &gt;</button>
      </div>
    </>
  )
}
