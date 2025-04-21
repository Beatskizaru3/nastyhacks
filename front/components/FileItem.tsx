// front/components/FileItem.tsx
'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import { FileData } from '../utils/api'

export function FileItem({ file }: { file: FileData }) {
  return (
    <div className="bg-white border rounded p-4 hover:shadow">
      <h3 className="text-lg font-semibold mb-1">
        <Link href={`/files/${file.id}`} className="hover:underline">
          {file.filename}
        </Link>
      </h3>
      <p className="text-sm text-gray-500 mb-2">
        {dayjs(file.uploaded_at).format('MMMM D, YYYY')}
      </p>
      <p className="text-sm text-gray-700 mb-3">
        {file.description || 'No description'}
      </p>
      <Link href={`/api/${file.filename}`} className="text-blue-600 hover:underline text-sm">
        Скачать
      </Link>
    </div>
  )
}
