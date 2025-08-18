import axios from 'axios';

// 운영 EC2 주소(일반 API): 3001 고정
const FASTAPI_BASE_URL = 'http://13.55.21.100:3001';

const client = axios.create({ baseURL: FASTAPI_BASE_URL });

export default client;


