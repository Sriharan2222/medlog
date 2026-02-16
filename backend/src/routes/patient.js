const express = require('express');
const { authenticate, requirePatient, prisma } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { generateQRDataUrl } = require('../utils/qr');

const router = express.Router();

// All patient routes require authentication + patient role
router.use(authenticate, requirePatient);

// GET /api/patient/prescriptions — View own prescriptions
router.get('/prescriptions', async (req, res) => {
    try {
        const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
        if (!patient) return res.status(404).json({ error: 'Patient profile not found' });

        const statusFilter = req.query.status;
        const where = { patientId: patient.id };
        if (statusFilter && ['ACTIVE', 'EXPIRED', 'REPLACED'].includes(statusFilter)) {
            where.status = statusFilter;
        }

        const prescriptions = await prisma.prescription.findMany({
            where,
            include: {
                doctor: { select: { name: true, hospital: true } }
            },
            orderBy: { prescribedAt: 'desc' }
        });

        res.json(prescriptions);
    } catch (err) {
        console.error('Get prescriptions error:', err);
        res.status(500).json({ error: 'Failed to get prescriptions' });
    }
});

// GET /api/patient/profile — View own profile
router.get('/profile', async (req, res) => {
    try {
        const patient = await prisma.patient.findUnique({
            where: { userId: req.user.userId },
            include: {
                user: { select: { email: true } }
            }
        });
        if (!patient) return res.status(404).json({ error: 'Patient profile not found' });

        res.json(patient);
    } catch (err) {
        console.error('Get patient profile error:', err);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// GET /api/patient/qr — Get own QR code
router.get('/qr', async (req, res) => {
    try {
        const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
        if (!patient) return res.status(404).json({ error: 'Patient profile not found' });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const qrUrl = `${frontendUrl}/scan/${patient.qrToken}`;
        const qrDataUrl = await generateQRDataUrl(qrUrl);

        res.json({
            qrDataUrl,
            qrUrl,
            qrToken: patient.qrToken,
            patientId: patient.uniquePatientId,
            patientName: patient.name
        });
    } catch (err) {
        console.error('Get QR error:', err);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// POST /api/patient/change-requests — Submit a change request
router.post('/change-requests', async (req, res) => {
    try {
        const { prescriptionId, reason } = req.body;

        if (!prescriptionId || !reason) {
            return res.status(400).json({ error: 'Prescription and reason are required' });
        }

        const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
        if (!patient) return res.status(404).json({ error: 'Patient profile not found' });

        const prescription = await prisma.prescription.findUnique({
            where: { id: prescriptionId }
        });

        if (!prescription || prescription.patientId !== patient.id) {
            return res.status(404).json({ error: 'Prescription not found' });
        }

        const changeRequest = await prisma.changeRequest.create({
            data: {
                patientId: patient.id,
                doctorId: prescription.doctorId,
                prescriptionId,
                reason
            },
            include: {
                prescription: { select: { medicationName: true } },
                doctor: { select: { name: true } }
            }
        });

        await logAudit(req.user.userId, 'CREATE_CHANGE_REQUEST', 'ChangeRequest', changeRequest.id, {
            prescriptionId, reason
        });

        res.status(201).json(changeRequest);
    } catch (err) {
        console.error('Create change request error:', err);
        res.status(500).json({ error: 'Failed to create change request' });
    }
});

// GET /api/patient/change-requests — View own change requests
router.get('/change-requests', async (req, res) => {
    try {
        const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
        if (!patient) return res.status(404).json({ error: 'Patient profile not found' });

        const requests = await prisma.changeRequest.findMany({
            where: { patientId: patient.id },
            include: {
                prescription: { select: { medicationName: true, dosage: true } },
                doctor: { select: { name: true, hospital: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(requests);
    } catch (err) {
        console.error('Get change requests error:', err);
        res.status(500).json({ error: 'Failed to get change requests' });
    }
});

module.exports = router;
