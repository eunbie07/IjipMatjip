import axios from 'axios';

// 운영 EC2 주소를 명시적으로 사용
const FASTAPI_BASE_URL = 'http://13.55.21.100:3000';

const client = axios.create({ baseURL: FASTAPI_BASE_URL });

export default client;