import React from "react";

export default function SearchBar({ onSearch }) {
  const [q, setQ] = React.useState("");

  // Instant search as user types
  React.useEffect(() => {
    if (onSearch) onSearch(q);
    // eslint-disable-next-line
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(q);
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-3 w-full md:w-auto">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by books and authors"
        className="flex-1 md:w-[600px] px-4 py-3 rounded border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-label="Search books"
      />
      <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded-md shadow-sm hover:bg-emerald-600">
        Search
      </button>
    </form>
  );
}
