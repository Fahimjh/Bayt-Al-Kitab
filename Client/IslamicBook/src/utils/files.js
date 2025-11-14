import axios from "./axios";

export function buildFileUrl(raw) {
  if (!raw) return "";
  const s = String(raw);
  if (/^https?:\/\//i.test(s)) return s;
  let p = s.replace(/\\/g, "/");
  if (!p.startsWith("/")) p = "/" + p;
  const base =
    (axios && axios.defaults && axios.defaults.baseURL
      ? String(axios.defaults.baseURL).replace(/\/api\/?$/, "")
      : process.env.REACT_APP_API_URL || "http://localhost:5000");
  return `${base}${p}`;
}
export default buildFileUrl;
