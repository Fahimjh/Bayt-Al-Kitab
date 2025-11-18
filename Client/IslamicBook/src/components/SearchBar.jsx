import React from "react";

export default function SearchBar({ value, onChange, onSearch, ...props }) {
  // Controlled input: value and onChange come from parent
  const handleInput = (e) => {
    if (onChange) onChange(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const submit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(value);
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 w-full justify-center" {...props}>
      <input
        value={value}
        onChange={handleInput}
        placeholder="Search by books and authors"
        className="w-96 max-w-full px-4 py-3 rounded border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-label="Search books"
      />
      <button type="submit" className="px-5 py-3 bg-emerald-500 text-white rounded-md shadow-sm hover:bg-emerald-600 whitespace-nowrap">
        Search
      </button>
    </form>
  );
}
