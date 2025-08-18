import axios from 'axios';

// 배포 환경에서 자동으로 현재 호스트의 3000 포트를 기본 API로 사용
const DEFAULT_BASE =
  typeof window !== 'undefined' && window.location && window.location.hostname
    ? `http://${window.location.hostname}:3000`
    : '';

// 환경변수 우선 → 없으면 현재 호스트:3000 사용
const FASTAPI_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CLOUD_API_BASE)
    || DEFAULT_BASE;

const client = axios.create({ baseURL: FASTAPI_BASE_URL });

export default client;