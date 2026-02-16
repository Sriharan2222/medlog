const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate, prisma } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { generatePatientId } = require('../utils/qr');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, role, name, hospital, regNumber, specialization, age, gender, phone } = req.body;

        if (!email || !password || !role || !name) {
            return res.status(400).json({ error: 'Email, password, role, and name are required' });
        }

        if (!['DOCTOR', 'PATIENT'].includes(role)) {
            return res.status(400).json({ error: 'Role must be DOCTOR or PATIENT' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, passwordHash, role }
        });

        if (role === 'DOCTOR') {
            if (!hospital || !regNumber) {
                await prisma.user.delete({ where: { id: user.id } });
                return res.status(400).json({ error: 'Hospital and registration number required for doctors' });
            }
            await prisma.doctor.create({
                data: {
                    userId: user.id,
                    name,
                    hospital,
                    regNumber,
                    specialization: specialization || ''
                }
            });
        } else {
            const uniquePatientId = generatePatientId(name);
            await prisma.patient.create({
                data: {
                    userId: user.id,
                    name,
                    uniquePatientId,
                    age: age ? parseInt(age) : 0,
                    gender: gender || '',
                    phone: phone || ''
                }
            });
        }

        await logAudit(user.id, 'REGISTER', 'User', user.id, `Registered as ${role}`);

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await logAudit(user.id, 'LOGIN', 'User', user.id);

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                doctor: true,
                patient: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { passwordHash, ...safeUser } = user;
        res.json(safeUser);
    } catch (err) {
        console.error('Get me error:', err);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

module.exports = router;
