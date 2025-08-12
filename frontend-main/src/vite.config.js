// frontend/vite.config.js
export default {
    server: {
      port: 4000,
      host: '0.0.0.0',
      proxy:{
        '/api': 'http://13.55.21.100:8001'
      }
    },
  };
  