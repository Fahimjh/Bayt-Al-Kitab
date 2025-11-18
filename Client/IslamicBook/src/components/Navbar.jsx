import React, { useEffect, useState } from "react";
import axios from "../utils/axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SearchBar from "../components/SearchBar";

export default function Navbar(props) {
  const auth = useAuth();
  const user = auth?.user;
  const navigate = useNavigate();
  const location = useLocation();
  // show live pending count badge for admins
  const [pendingCount, setPendingCount] = useState(0);

  // local UI state for the navbar controls (driven from URL)
  const [searchQ, setSearchQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    let mounted = true;
    const loadCounts = async () => {
      if (user?.role === "admin") {
        try {
          const [pendingRes, deleteRes] = await Promise.all([
            axios.get("/books/pending"),
            axios.get("/books/delete-requests")
          ]);
          const pending = Array.isArray(pendingRes.data) ? pendingRes.data.length : 0;
          const deletes = Array.isArray(deleteRes.data) ? deleteRes.data.length : 0;
          if (mounted) setPendingCount(pending + deletes);
        } catch {
          if (mounted) setPendingCount(0);
        }
      } else {
        if (mounted) setPendingCount(0);
      }
    };
    loadCounts();

    // Listen for pendingCountChanged events from AdminDashboard
    const handlePendingCountChanged = (e) => {
      if (user?.role === "admin") {
        // e.detail can be a number (pending only) or an object {pending, deletes}
        if (typeof e.detail === 'object' && e.detail !== null) {
          setPendingCount((e.detail.pending || 0) + (e.detail.deletes || 0));
        } else {
          // fallback: just pending
          setPendingCount(e.detail);
        }
      }
    };
    window.addEventListener("pendingCountChanged", handlePendingCountChanged);

    return () => {
      mounted = false;
      window.removeEventListener("pendingCountChanged", handlePendingCountChanged);
    };
  }, [user]);

  // keep local navbar controls in sync with query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get("search") || "";
    const c = params.get("category") || "All";
    setSearchQ(s);
    setSelectedCategory(c);
  }, [location.search]);

  const pushQuery = (s, c) => {
    const params = new URLSearchParams();
    if (s) params.set("search", s);
    if (c && c !== "All") params.set("category", c);
    navigate({ pathname: "/", search: params.toString() }, { replace: false });
  };

  const handleLogout = () => {
    auth.logout();
    navigate("/");
  };

  const handleSearch = (q) => {
    setSearchQ(q);
    pushQuery(q, selectedCategory);
  };

  const handleCategorySelect = (c) => {
    setSelectedCategory(c);
    pushQuery(searchQ, c);
  };

  // build categories list (do NOT include "All" here to avoid duplicates)
  const categories = ["Quran","Hadith","Seerah","Fiqh","Aqeedah","Dua","Tafsir","History"];

  // hide center controls on login/register and admin pages
  const hideNavControls = ["/login", "/register", "/admin"].some((p) =>
    location.pathname.startsWith(p)
  );

  return (
    <>
      <nav className="bg-transparent px-6 py-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
            <div className="flex items-center">
              {user ? (
                <div className="text-sm text-gray-200">
                  Signed in as <span className="font-semibold">{user.name || user.email}</span>
                  {" — "}
                  <span className="ml-2 inline-block bg-green-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                    {user.role}
                  </span>
                </div>
              ) : null}
            </div>

            {/* center: title + search + chips */}
            <div className="text-center">
              <Link to="/" className="text-white font-extrabold text-3xl md:text-4xl block">
                Bayt Al-Kitab
              </Link>

              {/* hide search + chips on login/register pages */}
              {!hideNavControls && (
                <>
                  {/* limit the search bar container and make the input fill it */}
                  <div className="mt-4 mx-auto" style={{ maxWidth: "32rem" }}>
                    <SearchBar
                      value={searchQ}
                      onSearch={(q) => handleSearch(q)}
                      className="w-full"
                      inputClassName="w-full bg-white text-gray-800 placeholder-gray-500 text-sm"
                    />
                  </div>

                  {/* chips: allow wrapping and display all categories (no scrollbar) */}
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 overflow-visible">
                    {!categories.includes("All") && (
                      <button
                        onClick={() => handleCategorySelect("All")}
                        className={
                          selectedCategory === "All"
                            ? "text-base px-4 py-2 bg-green-600 text-white rounded-md shadow"
                            : "text-base px-4 py-2 bg-gray-800 text-gray-200 rounded-md"
                        }
                      >
                        All
                      </button>
                    )}

                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleCategorySelect(c)}
                        className={
                          selectedCategory === c
                            ? "text-base px-4 py-2 bg-green-600 text-white rounded-md shadow"
                            : "text-base px-4 py-2 bg-gray-800 text-gray-200 rounded-md"
                        }
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* right: links */}
            <div className="flex justify-end items-center gap-6">
              <Link to="/" className="text-sm text-white">Home</Link>

              {user?.role === "admin" && (
                <Link to="/admin" className="text-sm text-white flex items-center">
                  Admin
                  <span className="ml-2 inline-block bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
                    {pendingCount}
                  </span>
                </Link>
              )}

              {user?.role === "writer" && (
                <Link to="/writer" className="text-sm text-white">Submit/Delete</Link>
              )}

              {!user ? (
                <>
                  <Link to="/login" className="text-sm text-white">Login</Link>
                  <Link to="/register" className="text-sm text-white">Register</Link>
                </>
              ) : (
                <button onClick={handleLogout} className="text-sm text-red-400">Logout</button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
