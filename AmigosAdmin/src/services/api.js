import axios from 'axios';

const API_URL = 'https://api.amigospizza.co/api'; 

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export default api;