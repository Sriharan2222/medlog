const { prisma } = require('./auth');

async function logAudit(userId, action, entity, entityId = '', details = '') {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                details: typeof details === 'object' ? JSON.stringify(details) : details
            }
        });
    } catch (err) {
        console.error('Audit log failed:', err.message);
    }
}

module.exports = { logAudit };
