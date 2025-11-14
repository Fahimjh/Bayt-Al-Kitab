import { useEffect, useState } from "react";
import axios from "../utils/axios";
import { useAuth } from "../context/AuthContext";
import buildFileUrl from "../utils/files";

export default function AdminDashboard() {
  const auth = useAuth();
  const { user } = auth;
  const [pending, setPending] = useState([]);
  const [deleteRequests, setDeleteRequests] = useState([]);

  // upload form state
  const [form, setForm] = useState({
    title: "",
    author: "",
    category: "All",
    description: "",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  // show/hide upload form (keep UI compact initially)
  const [showUpload, setShowUpload] = useState(false);

  const loadPending = async () => {
    try {
      const res = await axios.get("/books/pending");
      setPending(res.data || []);
      // notify other parts of app (Navbar) about new pending count
      window.dispatchEvent(
        new CustomEvent("pendingCountChanged", { detail: (res.data || []).length })
      );
    } catch (e) {
      setPending([]);
      window.dispatchEvent(new CustomEvent("pendingCountChanged", { detail: 0 }));
    }
  };

  const loadDeleteRequests = async () => {
    try {
      const res = await axios.get("/books/delete-requests");
      setDeleteRequests(res.data || []);
    } catch (e) {
      setDeleteRequests([]);
    }
  };

  const approve = async (id) => {
    try {
      await axios.put(`/books/admin/approve/${id}`);
      loadPending();
    } catch (e) {
      // ...existing code...
      alert("Approve failed");
    }
  };

  const reject = async (id) => {
    try {
      await axios.put(`/books/admin/reject/${id}`);
      loadPending();
    } catch (e) {
      // ...existing code...
      alert("Reject failed");
    }
  };

  // Approve delete request (actually deletes the book)
  const approveDelete = async (id) => {
    try {
      if (!window.confirm('Permanently delete this book?')) return;
      await axios.put(`/books/admin/approve-delete/${id}`);
      loadDeleteRequests();
      alert('Book deleted');
    } catch (e) {
      alert('Delete failed');
    }
  };

  // Reject delete request (restores book to approved)
  const rejectDelete = async (id) => {
    try {
      await axios.put(`/books/admin/reject-delete/${id}`);
      loadDeleteRequests();
      alert('Delete request rejected, book restored');
    } catch (e) {
      alert('Reject failed');
    }
  };

  useEffect(() => {
    loadPending();
    loadDeleteRequests();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
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

      // POST to books endpoint — include auth token (or send credentials)
      await axios.post("/books/upload", fd, {
        headers: {
          // if your auth provides a bearer token
          ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        // if your server uses cookie auth, enable credentials
        withCredentials: true,
      });

      setForm({ title: "", author: "", category: "All", description: "" });
      setCoverFile(null);
      setPdfFile(null);
      alert("Upload submitted");
      loadPending();
    } catch (err) {
      // ...existing code...
      alert(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setLoadingUpload(false);
    }
  };

  return (
    <div>
      {/* center header so it visually groups with the upload card */}
      <div className="max-w-2xl mx-auto mb-6 text-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      {/* upload form: show compact prompt first, expand on demand; limit width */}
      {user?.role === "admin" && (
        <section className="mb-6">
          {!showUpload ? (
            <div className="p-4 border rounded max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Upload / Remove books</h2>
                  <p className="text-sm text-gray-400">
                    You have {pending.length} pending approval
                    {pending.length !== 1 ? "s" : ""}. Click below to open the
                    upload form.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => setShowUpload(true)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Show upload form
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <section className="mb-6 p-4 border rounded max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Upload book (admin)</h2>
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
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="border p-2 bg-white text-gray-900 placeholder-gray-500"
                />
                <input
                  placeholder="Author"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="border p-2 bg-white text-gray-900 placeholder-gray-500"
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="border p-2 bg-white text-gray-900 placeholder-gray-500"
                />
                <label className="text-sm">Cover image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
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
                    {loadingUpload ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">Pending approvals</h2>
        {pending.length === 0 ? (
          <p>No pending books</p>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {pending.map((b) => (
              <div key={b._id} className="flex items-center gap-4 p-3 rounded border">
                <img
                  src={buildFileUrl(b.coverImage)}
                  onError={(e) => { e.currentTarget.src = "/placeholder-cover.png"; }}
                  className="w-20 h-28 object-cover rounded"
                  alt={b.title || "cover"}
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{b.title}</h3>
                  <p className="text-sm text-gray-600">
                    {(b.authorName ?? b.author ?? "Unknown author")} • {(b.category ?? "Uncategorized")}
                  </p>
                  {b.uploadedBy?.name && (
                    <p className="text-xs text-gray-500">Uploaded by: {b.uploadedBy.name}</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={() => approve(b._id)} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                  <button onClick={() => reject(b._id)} className="bg-yellow-600 text-white px-3 py-1 rounded">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Delete Requests</h2>
        {deleteRequests.length === 0 ? (
          <p>No delete requests</p>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {deleteRequests.map((b) => (
              <div key={b._id} className="flex items-center gap-4 p-3 rounded border bg-red-50">
                <img
                  src={buildFileUrl(b.coverImage)}
                  onError={(e) => { e.currentTarget.src = "/placeholder-cover.png"; }}
                  className="w-20 h-28 object-cover rounded"
                  alt={b.title || "cover"}
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{b.title}</h3>
                  <p className="text-sm text-gray-600">
                    {(b.authorName ?? b.author ?? "Unknown author")} • {(b.category ?? "Uncategorized")}
                  </p>
                  {b.uploadedBy?.name && (
                    <p className="text-xs text-gray-500">Uploaded by: {b.uploadedBy.name}</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={() => approveDelete(b._id)} className="bg-red-700 text-white px-3 py-1 rounded">Approve Delete</button>
                  <button onClick={() => rejectDelete(b._id)} className="bg-yellow-600 text-white px-3 py-1 rounded">Reject Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
