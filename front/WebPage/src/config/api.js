/**
 * 백엔드 API 베이스 URL (끝에 / 없음).
 * - 비어 있으면: 상대 경로만 사용 → `npm run dev` 시 Vite proxy(로컬 8080)로 전달.
 * - 값이 있으면: 배포 서버 등 절대 URL로 fetch (예: https://capston.p-e.kr).
 */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL ?? "";
  return String(raw).trim().replace(/\/+$/, "");
}

/**
 * @param {string} path API 경로, 반드시 '/'로 시작 (예: '/games', '/auth/me')
 */
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${p}` : p;
}
