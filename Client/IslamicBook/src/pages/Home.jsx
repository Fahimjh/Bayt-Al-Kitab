import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import API from "../utils/axios";
import BookRow from "../components/BookRow";
import buildFileUrl from "../utils/files";
import { useAuth } from "../context/AuthContext";
import SearchBar from "../components/SearchBar";

const defaultCategories = [
  "Quran",
  "Hadith",
  "Seerah",
  "Fiqh",
  "Aqeedah",
  "Dua",
  "Tafsir",
  "History",
];

export default function Home() {
  const location = useLocation();
  const { user } = useAuth() || {};
  const [books, setBooks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminDeleteMode, setAdminDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQ(params.get("search") || "");
    setSelectedCategory(params.get("category") || "All");
  }, [location.search]);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedCategory && selectedCategory !== "All")
          params.category = selectedCategory;
        // Don't send search param for instant search, filter client-side
        const res = await API.get("/books", { params });
        const withSrc = (res.data || []).map((b) => ({
          ...b,
          coverSrc: buildFileUrl(b.coverUrl || b.coverImage || b.cover),
        }));
        setBooks(withSrc);
      } catch (err) {
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [selectedCategory]);

  // Instant search: filter client-side
  const filteredBooks = React.useMemo(() => {
    if (!searchQ) return books;
    const q = searchQ.toLowerCase();
    return books.filter(
      (b) =>
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q))
    );
  }, [books, searchQ]);

  // Handler for SearchBar
  const handleSearch = useCallback((q) => {
    setSearchQ(q);
  }, []);

  // group books by category for rows
  const grouped = {};
  books.forEach((b) => {
    const cat = b.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(b);
  });


  const visibleBooks = filteredBooks;

  return (
    <div className="p-4">

      {user?.role === 'admin' && (
        <div className="flex items-center gap-3 mb-4">
          {!adminDeleteMode ? (
            <button
              className="px-3 py-1 rounded bg-red-600 text-white"
              onClick={() => { setAdminDeleteMode(true); setSelectedIds(new Set()); }}
            >
              Delete books
            </button>
          ) : (
            <>
              <button
                className="px-3 py-1 rounded bg-gray-700 text-white"
                onClick={() => { setAdminDeleteMode(false); setSelectedIds(new Set()); }}
              >
                Cancel
              </button>
              <button
                disabled={selectedIds.size === 0}
                className={`px-3 py-1 rounded ${selectedIds.size? 'bg-red-700 text-white' : 'bg-gray-400 text-gray-200'}`}
                onClick={async () => {
                  if (selectedIds.size === 0) return;
                  if (!confirm(`Delete ${selectedIds.size} selected book(s)?`)) return;
                  try {
                    await Promise.all(Array.from(selectedIds).map(id => API.delete(`/books/${id}`)));
                    setSelectedIds(new Set());
                    setAdminDeleteMode(false);
                    // refresh list
                    const res = await API.get('/books', { params: (selectedCategory && selectedCategory !== 'All') ? { category: selectedCategory, ...(searchQ?{search:searchQ}:{}) } : (searchQ?{search:searchQ}:{}) });
                    const withSrc = (res.data || []).map((b) => ({ ...b, coverSrc: buildFileUrl(b.coverUrl || b.coverImage || b.cover) }));
                    setBooks(withSrc);
                    alert('Deleted');
                  } catch (e) {
                    alert('Delete failed');
                  }
                }}
              >
                Delete selected ({selectedIds.size})
              </button>
            </>
          )}
        </div>
      )}


      <div className="mt-6">
        {loading && (
          <p className="text-center text-sm text-gray-400">Loading books…</p>
        )}

        {!loading && location.pathname === "/" && visibleBooks.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            {searchQ || (selectedCategory && selectedCategory !== "All")
              ? `No books found${searchQ ? ` for "${searchQ}"` : ""}${selectedCategory && selectedCategory !== "All" ? ` in "${selectedCategory}"` : ""}.`
              : "No books found."}
          </p>
        )}

        {!loading && visibleBooks.length > 0 && (
          <div className="flex flex-wrap gap-6">
            {visibleBooks.map((book) => (
              <BookRow
                key={book._id}
                book={book}
                adminMode={user?.role === 'admin' && adminDeleteMode}
                selected={selectedIds.has(book._id)}
                onToggle={() => setSelectedIds(prev => { const next = new Set(prev); if (next.has(book._id)) next.delete(book._id); else next.add(book._id); return next; })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
