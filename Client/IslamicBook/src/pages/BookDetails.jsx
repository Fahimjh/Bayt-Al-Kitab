import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../utils/axios";
import buildFileUrl from "../utils/files";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

export default function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await API.get(`/books/${id}`);
        if (!mounted) return;
        setBook(res.data);
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.message || "Failed to load book");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!book) return <div className="p-6">Book not found</div>;

  const rawPdf = book.pdfUrl || book.fileUrl || book.pdf || book.url;
  const coverUrl = buildFileUrl(book.coverImage);
  // Use direct Cloudinary (or HTTP) URL for PDF, fallback to buildFileUrl for local
  const pdfUrl = /^https?:\/\//i.test(String(rawPdf))
    ? rawPdf
    : buildFileUrl(rawPdf);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{book.title}</h1>
      <p className="text-sm text-gray-500 mb-4">{book.author || "Unknown"}</p>

      <div className="flex gap-6">
        <div className="flex-1">
          {pdfUrl ? (
            <div style={{ height: 720, border: "1px solid #e5e7eb" }}>
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.min.js">
                <Viewer fileUrl={pdfUrl} />
              </Worker>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No PDF available.</p>
          )}
        </div>

        <aside className="w-64">
          <img
            src={coverUrl || "/placeholder-cover.png.svg"}
            alt=""
            className="w-full rounded mb-4"
            onError={(e) => e.target.src = "/placeholder-cover.png.svg"}
          />
          {pdfUrl && (
            <>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="block mb-2 px-4 py-2 bg-blue-600 text-white rounded"
              >
                Open in new tab
              </a>
              <a
                href={pdfUrl}
                download
                className="block px-4 py-2 bg-green-600 text-white rounded"
              >
                Download
              </a>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
