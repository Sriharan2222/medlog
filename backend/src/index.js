require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
    origin: frontendUrl === '*' ? true : frontendUrl,
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'MedLog API', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// In production, start Next.js standalone server and proxy non-API requests to it
const possiblePaths = [
    path.join(__dirname, '../../frontend/.next/standalone/frontend/server.js'),
    path.join(__dirname, '../../frontend/.next/standalone/server.js'),
    path.resolve('/app/frontend/.next/standalone/frontend/server.js'),
    path.resolve('/app/frontend/.next/standalone/server.js'),
];

let nextStandalonePath = null;
for (const p of possiblePaths) {
    console.log(`Checking: ${p} -> ${fs.existsSync(p) ? 'EXISTS' : 'not found'}`);
    if (fs.existsSync(p)) { nextStandalonePath = p; break; }
}

if (nextStandalonePath) {
    // Copy static files for Next.js
    const staticSrc = path.join(path.dirname(nextStandalonePath), '../static');
    const publicSrc = path.join(path.dirname(nextStandalonePath), '../../public');
    console.log(`🌐 Starting Next.js frontend server from: ${nextStandalonePath}`);
    const nextServer = spawn('node', [nextStandalonePath], {
        env: { ...process.env, PORT: '3000', HOSTNAME: '0.0.0.0' },
        stdio: 'inherit'
    });
    nextServer.on('error', (err) => console.error('Next.js server error:', err));

    // Give Next.js 2 seconds to boot before proxying
    setTimeout(() => {
        app.use('/', createProxyMiddleware({
            target: 'http://127.0.0.1:3000',
            changeOrigin: true,
            ws: true,
            filter: (req) => !req.path.startsWith('/api')
        }));
        console.log('🔗 Frontend proxied from Next.js standalone server');
    }, 2000);
} else {
    console.log('ℹ️ No Next.js standalone build found — running API-only mode');
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏥 MedLog API running on port ${PORT}`);
});
