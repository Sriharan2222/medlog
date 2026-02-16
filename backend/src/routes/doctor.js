const express = require('express');
const { authenticate, requireDoctor, prisma } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// All doctor routes require authentication + doctor role
router.use(authenticate, requireDoctor);

// GET /api/doctor/patients/find/:uniquePatientId — Find a patient by their unique ID
router.get('/patients/find/:uniquePatientId', async (req, res) => {
    try {
        const patient = await prisma.patient.findUnique({
            where: { uniquePatientId: req.params.uniquePatientId },
            include: {
                user: { select: { email: true } },
                prescriptions: {
                    include: {
                        doctor: { select: { name: true, hospital: true } }
                    },
                    orderBy: { prescribedAt: 'desc' }
                },
                changeRequests: {
                    include: {
                        prescription: { select: { medicationName: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!patient) {
            return res.status(404).json({ error: 'No patient found with that ID. Make sure the patient has registered first.' });
        }

        res.json(patient);
    } catch (err) {
        console.error('Find patient error:', err);
        res.status(500).json({ error: 'Failed to find patient' });
    }
});

// GET /api/doctor/patients — List all patients (that this doctor has prescribed to)
router.get('/patients', async (req, res) => {
    try {
        const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
        if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

        // Get all patients this doctor has prescribed to, or all patients if search provided
        const search = req.query.search || '';

        let patients;
        if (search) {
            patients = await prisma.patient.findMany({
                where: {
                    OR: [
                        { name: { contains: search } },
                        { uniquePatientId: { contains: search } }
                    ]
                },
                include: {
                    user: { select: { email: true } },
                    prescriptions: {
                        where: { doctorId: doctor.id },
                        orderBy: { prescribedAt: 'desc' },
                        take: 1
                    }
                },
                orderBy: { name: 'asc' }
            });
        } else {
            // Get patients this doctor has interacted with
            const prescriptions = await prisma.prescription.findMany({
                where: { doctorId: doctor.id },
                select: { patientId: true },
                distinct: ['patientId']
            });

            const patientIds = prescriptions.map(p => p.patientId);

            patients = await prisma.patient.findMany({
                where: { id: { in: patientIds } },
                include: {
                    user: { select: { email: true } },
                    prescriptions: {
                        where: { doctorId: doctor.id },
                        orderBy: { prescribedAt: 'desc' },
                        take: 1
                    }
                },
                orderBy: { name: 'asc' }
            });
        }

        res.json(patients);
    } catch (err) {
        console.error('List patients error:', err);
        res.status(500).json({ error: 'Failed to list patients' });
    }
});

// GET /api/doctor/patients/:id — Get patient detail with all prescriptions
router.get('/patients/:id', async (req, res) => {
    try {
        const patient = await prisma.patient.findUnique({
            where: { id: req.params.id },
            include: {
                user: { select: { email: true } },
                prescriptions: {
                    include: {
                        doctor: { select: { name: true, hospital: true } }
                    },
                    orderBy: { prescribedAt: 'desc' }
                },
                changeRequests: {
                    include: {
                        prescription: { select: { medicationName: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(patient);
    } catch (err) {
        console.error('Get patient error:', err);
        res.status(500).json({ error: 'Failed to get patient' });
    }
});

// POST /api/doctor/prescriptions — Create a new prescription
router.post('/prescriptions', async (req, res) => {
    try {
        const { patientId, medicationName, dosage, frequency, duration, notes, expiresAt } = req.body;

        if (!patientId || !medicationName || !dosage || !frequency || !duration) {
            return res.status(400).json({ error: 'Patient, medication name, dosage, frequency, and duration are required' });
        }

        const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
        if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

        const patient = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        // Auto-replace older active prescriptions of the same medication
        await prisma.prescription.updateMany({
            where: {
                patientId,
                medicationName: { equals: medicationName },
                status: 'ACTIVE'
            },
            data: { status: 'REPLACED' }
        });

        const prescription = await prisma.prescription.create({
            data: {
                patientId,
                doctorId: doctor.id,
                medicationName,
                dosage,
                frequency,
                duration,
                notes: notes || '',
                expiresAt: expiresAt ? new Date(expiresAt) : null
            },
            include: {
                doctor: { select: { name: true, hospital: true } },
                patient: { select: { name: true, uniquePatientId: true } }
            }
        });

        await logAudit(req.user.userId, 'CREATE_PRESCRIPTION', 'Prescription', prescription.id, {
            medicationName, dosage, patientId
        });

        res.status(201).json(prescription);
    } catch (err) {
        console.error('Create prescription error:', err);
        res.status(500).json({ error: 'Failed to create prescription' });
    }
});

// GET /api/doctor/change-requests — View pending change requests
router.get('/change-requests', async (req, res) => {
    try {
        const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
        if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

        const requests = await prisma.changeRequest.findMany({
            where: { doctorId: doctor.id },
            include: {
                patient: { select: { name: true, uniquePatientId: true } },
                prescription: { select: { medicationName: true, dosage: true, status: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(requests);
    } catch (err) {
        console.error('List change requests error:', err);
        res.status(500).json({ error: 'Failed to list change requests' });
    }
});

// POST /api/doctor/change-requests/:id/respond — Respond to a change request
router.post('/change-requests/:id/respond', async (req, res) => {
    try {
        const { doctorResponse, status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        if (status === 'RESPONDED' && !doctorResponse) {
            return res.status(400).json({ error: 'Response text is required when responding' });
        }

        if (!['RESPONDED', 'DISMISSED'].includes(status)) {
            return res.status(400).json({ error: 'Status must be RESPONDED or DISMISSED' });
        }

        const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });

        const changeRequest = await prisma.changeRequest.update({
            where: { id: req.params.id },
            data: {
                doctorResponse,
                status,
                respondedAt: new Date()
            },
            include: {
                patient: { select: { name: true } },
                prescription: { select: { medicationName: true } }
            }
        });

        await logAudit(req.user.userId, 'RESPOND_CHANGE_REQUEST', 'ChangeRequest', changeRequest.id, {
            status, doctorResponse
        });

        res.json(changeRequest);
    } catch (err) {
        console.error('Respond to change request error:', err);
        res.status(500).json({ error: 'Failed to respond to change request' });
    }
});

module.exports = router;
