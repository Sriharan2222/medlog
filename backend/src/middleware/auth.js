const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function requireDoctor(req, res, next) {
    if (req.user.role !== 'DOCTOR') {
        return res.status(403).json({ error: 'Doctor access required' });
    }
    next();
}

function requirePatient(req, res, next) {
    if (req.user.role !== 'PATIENT') {
        return res.status(403).json({ error: 'Patient access required' });
    }
    next();
}

module.exports = { authenticate, requireDoctor, requirePatient, prisma };
