import React from "react";

export default function SearchBar({ onSearch }) {
  const [q, setQ] = React.useState("");
  const submit = (e) => { e.preventDefault(); onSearch && onSearch(q); };

  return (
    <form onSubmit={submit} className="flex items-center gap-3 w-full md:w-auto">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search books, authors, topics..."
        className="flex-1 md:w-[600px] px-4 py-3 rounded border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-label="Search books"
      />
      <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded-md shadow-sm hover:bg-emerald-600">
        Search
      </button>
    </form>
  );
}
