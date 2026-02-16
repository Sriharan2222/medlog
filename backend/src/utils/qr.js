const QRCode = require('qrcode');

async function generateQRDataUrl(text) {
    try {
        return await QRCode.toDataURL(text, {
            width: 400,
            margin: 2,
            color: {
                dark: '#1a365d',
                light: '#ffffff'
            }
        });
    } catch (err) {
        console.error('QR generation failed:', err);
        return null;
    }
}

function generatePatientId(name) {
    const firstName = name.trim().split(/\s+/)[0].toUpperCase();
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${firstName}-${num}`;
}

module.exports = { generateQRDataUrl, generatePatientId };
