const express = require('express');
const { prisma } = require('../middleware/auth');

const router = express.Router();

// GET /api/public/patient/:qrToken — Public QR view (no auth)
router.get('/patient/:qrToken', async (req, res) => {
    try {
        const patient = await prisma.patient.findUnique({
            where: { qrToken: req.params.qrToken },
            select: {
                name: true,
                uniquePatientId: true,
                age: true,
                gender: true,
                prescriptions: {
                    where: { status: 'ACTIVE' },
                    select: {
                        medicationName: true,
                        dosage: true,
                        frequency: true,
                        duration: true,
                        notes: true,
                        status: true,
                        prescribedAt: true,
                        doctor: {
                            select: { name: true, hospital: true }
                        }
                    },
                    orderBy: { prescribedAt: 'desc' }
                }
            }
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json({
            patientName: patient.name,
            patientId: patient.uniquePatientId,
            age: patient.age,
            gender: patient.gender,
            activeMedications: patient.prescriptions,
            lastUpdated: patient.prescriptions.length > 0
                ? patient.prescriptions[0].prescribedAt
                : null
        });
    } catch (err) {
        console.error('Public QR view error:', err);
        res.status(500).json({ error: 'Failed to load patient data' });
    }
});

module.exports = router;
