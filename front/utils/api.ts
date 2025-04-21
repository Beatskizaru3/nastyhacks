// front/utils/api.ts

export interface FileData {
  id: number
  filename: string
  filepath: string
  description: string
  youtube_link: string
  preview_image: string
  uploaded_at: string
  download_count: number
  real_download_count: number
}

export async function getFiles(
  sort = 'date',
  page = 1,
  limit = 10
): Promise<FileData[]> {
  const res = await fetch(`/api/files?sort=${sort}&page=${page}&limit=${limit}`)
  if (!res.ok) throw new Error(res.statusText)
  const json = await res.json()
  return json.files as FileData[]
}

export interface LoginResponse {
  token: string
}

/**
 * Отправляет POST /api/login и возвращает токен.
 */
export async function loginUser(username: string, password: string): Promise<string> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Login failed: ${res.status} – ${text}`)
  }
  const data = (await res.json()) as LoginResponse
  return data.token
}

/**
 * Отправляет FormData на /api/admin/upload с JWT в заголовке.
 */
export async function uploadFile(formData: FormData): Promise<void> {
  const token = localStorage.getItem('token') || ''
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ошибка загрузки: ${res.status} – ${text}`)
  }
}
