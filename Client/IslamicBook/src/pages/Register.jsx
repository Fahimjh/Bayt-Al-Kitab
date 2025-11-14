import { useState } from "react";
import axios from "../utils/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "reader" });
  const navigate = useNavigate();
  const auth = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/register", form);
      // if server returns token + user, log in immediately
      if (res.data.token && res.data.user) {
        auth.login(res.data.user, res.data.token);
        alert("Account created and logged in");
        navigate("/");
        return;
      }
      alert("Account created");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleRegister} className="flex flex-col gap-2 border p-6 rounded-lg w-80">
        <h2 className="font-bold text-xl text-center mb-2">Register</h2>

        <input
          placeholder="Name"
          className="border p-2 bg-white text-gray-800"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Email"
          className="border p-2 bg-white text-gray-800"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 bg-white text-gray-800"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="border p-2 bg-white text-gray-800"
        >
          <option value="reader">Reader</option>
          <option value="writer">Writer</option>
        </select>

        <button className="bg-green-500 text-white p-2 rounded">Register</button>
      </form>
    </div>
  );
}

export default Register;
