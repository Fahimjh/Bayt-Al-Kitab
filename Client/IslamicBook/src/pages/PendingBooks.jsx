import React, { useEffect, useState } from "react";
import axios from "../utils/axios";
import buildFileUrl from "../utils/files";

export default function PendingBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchPending = async () => {
      try {
        const res = await axios.get("/books/pending");
        if (mounted) setBooks(res.data || []);
      } catch (err) {
        // ...existing code...
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPending();
    return () => { mounted = false; };
  }, []);

  const handleAction = async (id, type) => {
    try {
      setActionLoading(id);
      await axios.put(`/books/admin/${type}/${id}`);
      setBooks((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      // ...existing code...
      alert(err.response?.data?.message || `Could not ${type} book`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-6">Loading pending books…</div>;
  if (books.length === 0) return <div className="p-6">No pending books.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pending Books</h1>

      {books.map((b) => (
        <div key={b._id} className="flex items-center gap-4 bg-gray-800 p-3 rounded my-2">
          <img
            src={buildFileUrl(b.coverImage)}
            alt={b.title || "cover"}
            className="w-24 h-32 object-cover rounded"
            onError={(e) => e.target.src = "/placeholder-cover.png"}
          />
          <div className="flex-1">
            <h2 className="text-lg">{b.title}</h2>
            <p className="text-sm text-gray-300">
              {b.authorName ?? b.author ?? "Unknown author"} • {b.category ?? "Uncategorized"}
            </p>
          </div>
          <div>
            <button
              onClick={() => handleAction(b._id, "approve")}
              disabled={actionLoading === b._id}
              className="bg-green-500 px-3 py-1 rounded mr-2 disabled:opacity-60"
            >
              {actionLoading === b._id ? "..." : "Approve"}
            </button>
            <button
              onClick={() => handleAction(b._id, "reject")}
              disabled={actionLoading === b._id}
              className="bg-red-500 px-3 py-1 rounded disabled:opacity-60"
            >
              {actionLoading === b._id ? "..." : "Reject"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
