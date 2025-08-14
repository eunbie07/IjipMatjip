import axios from 'axios';

// 개발/운영 환경 모두 원격 서버 주소를 사용하도록 통일합니다.
const FASTAPI_BASE_URL = 'http://13.55.21.100:3001'; 

const client = axios.create({
  baseURL: FASTAPI_BASE_URL,
});

export default client;