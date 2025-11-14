import React from "react";
import buildFileUrl from "../utils/files";

export default function BookRow({ book, adminMode = false, selected = false, onToggle = () => {} }) {
  if (!book) return null; // <-- Prevents crash if book is undefined

  const coverRaw = book.coverUrl || book.coverImage || book.cover || "";
  const coverSrc = buildFileUrl(coverRaw);

  return (
    <a href={`/book/${book._id}`} className="shrink-0 w-44 hover:scale-105 transition transform" onClick={e => { if (adminMode) { e.preventDefault(); onToggle(); } }}>
      <div className="relative">
        {adminMode && (
          <button
            onClick={(e) => { e.preventDefault(); onToggle(); }}
            className={`absolute top-1 right-1 w-5 h-5 rounded border ${selected ? 'bg-green-600 border-green-700' : 'bg-white border-gray-300'} flex items-center justify-center text-white text-xs`}
            aria-label={selected ? 'Unselect' : 'Select'}
          >
            {selected ? '✓' : ''}
          </button>
        )}
        <img
          src={coverSrc || "/placeholder-cover.png.svg"}
          alt={book.title}
          className="w-44 h-64 object-cover rounded-lg"
          onError={e => {
            if (!e.currentTarget.src.endsWith('placeholder-cover.png.svg')) {
              e.currentTarget.src = "/placeholder-cover.png.svg";
            }
          }}
        />
      </div>
      <h3 className="mt-2 font-medium text-sm">{book.title}</h3>
      <p className="text-xs text-gray-500">{book.author}</p>
    </a>
  );
}
