import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken() {
    if (typeof window !== 'undefined') {
        return Cookies.get('medlog_token');
    }
    return null;
}

function setToken(token) {
    Cookies.set('medlog_token', token, { expires: 1, sameSite: 'lax' });
}

function removeToken() {
    Cookies.remove('medlog_token');
}

function getRole() {
    if (typeof window !== 'undefined') {
        return Cookies.get('medlog_role');
    }
    return null;
}

function setRole(role) {
    Cookies.set('medlog_role', role, { expires: 1, sameSite: 'lax' });
}

function removeRole() {
    Cookies.remove('medlog_role');
}

async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
    };

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (res.status === 401) {
        removeToken();
        removeRole();
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        throw new Error('Unauthorized');
    }

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
    }

    return data;
}

export {
    apiFetch,
    getToken,
    setToken,
    removeToken,
    getRole,
    setRole,
    removeRole,
    API_URL
};
