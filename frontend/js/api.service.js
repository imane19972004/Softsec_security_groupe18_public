const API = axios.create({
  baseURL: '', // baseURL intentionally empty: API calls are proxied by frontend server
  withCredentials: true
});

// Attach token automatically
API.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
