import axios from 'axios';

const FASTAPI_BASE_URL = '/bidanee-api';  // 그대로

const client = axios.create({
  baseURL: FASTAPI_BASE_URL,
});

export default client;