'use client'

export default function SearchBar() {
  return (
    <div className="bg-white border-t">
      <div className="container mx-auto px-4 py-2">
        <input
          type="text"
          placeholder="Search"
          className="w-full border rounded px-3 py-2"
        />
      </div>
    </div>
  )
}
