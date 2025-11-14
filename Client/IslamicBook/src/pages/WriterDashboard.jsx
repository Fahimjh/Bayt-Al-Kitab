import React, { useEffect, useState } from "react";
import axios from "../utils/axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import buildFileUrl from "../utils/files";
import BookRow from "../components/BookRow";

export default function WriterDashboard() {
  const auth = useAuth();
  const user = auth?.user;

  const [myBooks, setMyBooks] = useState([]);

  // writer upload state
  const [form, setForm] = useState({
    title: "",
    author: "",
    category: "All",
    description: "",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [writerDeleteMode, setWriterDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [loadingUpload, setLoadingUpload] = useState(false);
  // show the upload form for writers by default (change to false to revert to compact prompt)
  const [showUpload, setShowUpload] = useState(false);

  const handleUpload = async (e) => {
    e && e.preventDefault();
    if (!form.title || !form.author || !coverFile || !pdfFile) {
      alert("Please fill title, author and select cover + pdf files.");
      return;
    }
    try {
      setLoadingUpload(true);
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("author", form.author);
      fd.append("category", form.category);
      fd.append("description", form.description);
      fd.append("cover", coverFile);
      fd.append("pdf", pdfFile);

      // submit as writer — server should mark as pending
      await axios.post("/books/upload", fd);

      setForm({ title: "", author: "", category: "All", description: "" });
      setCoverFile(null);
      setPdfFile(null);
      setShowUpload(false);
      alert("Upload submitted for approval");
      load();
    } catch (err) {
      // ...existing code...
      alert(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setLoadingUpload(false);
    }
  };

  const load = async () => {
    if (!user) return;
    // fetch books uploaded by current user
    const r = await axios.get("/books/user");
    setMyBooks(r.data);
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      await axios.delete(`/books/${bookId}`);
      alert("Book deleted successfully");
      load();
    } catch (err) {
      // ...existing code...
      alert(err.response?.data?.message || "Failed to delete book");
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  return (
    <div>
      {user && String(user.role || "").toLowerCase() === "writer" && (
        <section className="mb-6">
          {!showUpload ? (
            <div className="p-4 border rounded max-w-2xl mx-auto flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Upload a book</h2>
                <p className="text-sm text-gray-400">
                  Submit a book for admin approval.
                </p>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Show submit form
              </button>
            </div>
          ) : (
            <div className="mb-6 p-4 border rounded max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Upload book</h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="text-sm text-gray-400"
                >
                  Hide
                </button>
              </div>
              <form onSubmit={handleUpload} className="flex flex-col gap-2">
                <input
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  className="border p-2 bg-white text-gray-900 placeholder-gray-500"
                />
                <input
                  placeholder="Author"
                  value={form.author}
                  onChange={(e) =>
                    setForm({ ...form, author: e.target.value })
                  }
                  className="border p-2 bg-white text-gray-900 placeholder-gray-500"
                />
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="border p-2 bg-white text-gray-900"
                >
                  <option>All</option>
                  <option>Quran</option>
                  <option>Hadith</option>
                  <option>Seerah</option>
                  <option>Fiqh</option>
                  <option>Aqeedah</option>
                  <option>Dua</option>
                  <option>Tafsir</option>
                  <option>History</option>
                </select>
                <textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="border p-2 bg-white text-gray-900 placeholder-gray-500"
                />
                <label className="text-sm">Cover image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCoverFile(e.target.files?.[0] || null)
                  }
                />
                <label className="text-sm">PDF file</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
                <div>
                  <button
                    disabled={loadingUpload}
                    type="submit"
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    {loadingUpload ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}
      <h1 className="text-2xl font-bold mb-4">My Uploads</h1>
      {myBooks.length === 0 && <p>You haven't uploaded any books yet.</p>}

      {/* writer delete mode similar to admin selection */}
      <div className="flex items-center gap-3 mb-4">
        {!writerDeleteMode ? (
          <button
            className="px-3 py-1 rounded bg-red-600 text-white"
            onClick={() => { setWriterDeleteMode(true); setSelectedIds(new Set()); }}
          >
            Request deletion
          </button>
        ) : (
          <>
            <button
              className="px-3 py-1 rounded bg-gray-700 text-white"
              onClick={() => { setWriterDeleteMode(false); setSelectedIds(new Set()); }}
            >
              Cancel
            </button>
            <button
              disabled={selectedIds.size === 0}
              className={`px-3 py-1 rounded ${selectedIds.size? 'bg-red-700 text-white' : 'bg-gray-400 text-gray-200'}`}
              onClick={async () => {
                if (selectedIds.size === 0) return;
                if (!confirm(`Send delete request for ${selectedIds.size} book(s)?`)) return;
                try {
                  // Send delete request to admin for each selected book
                  await Promise.all(Array.from(selectedIds).map(id => axios.post(`/books/request-delete/${id}`)));
                  setSelectedIds(new Set());
                  setWriterDeleteMode(false);
                  load();
                  alert('Delete request sent to admin');
                } catch (e) {
                  alert('Delete request failed');
                }
              }}
            >
              Submit request ({selectedIds.size})
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-6">
        {myBooks.map((book) => (
          <div key={book._id} className="relative">
            <BookRow
              book={book}
              adminMode={writerDeleteMode}
              selected={selectedIds.has(book._id)}
              onToggle={() => setSelectedIds(prev => { const next = new Set(prev); if (next.has(book._id)) next.delete(book._id); else next.add(book._id); return next; })}
            />
            <p className="text-xs text-gray-500 mt-1">Status: <span className="font-medium">{book.status}</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}
