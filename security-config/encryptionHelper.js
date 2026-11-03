/**
 * rorraxy security configuration - Encryption Helper
 * Provides AES-256-CBC encryption and decryption for sensitive data.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

// সিক্রেট কি থেকে সুনির্দিষ্ট ৩২ বাইটের কি জেনারেট করা
const getKey = (secretKey) => {
    return crypto.createHash('sha256').update(String(secretKey)).digest();
};

const encryptionHelper = {
    /**
     * ডাটা এনক্রিপ্ট করার ফাংশন
     * @param {string} text - যে টেক্সট এনক্রিপ্ট করতে হবে
     * @param {string} [secretKey] - কাস্টম কি (ঐচ্ছিক)
     */
    encrypt: (text, secretKey) => {
        try {
            const iv = crypto.randomBytes(16);
            const key = getKey(secretKey || process.env.ENCRYPTION_KEY || 'rorraxy-default-secure-32-byte-key!!');
            const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            return {
                success: true,
                iv: iv.toString('hex'),
                encryptedData: encrypted
            };
        } catch (error) {
            console.error('[Encryption Error]:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * এনক্রিপ্টেড ডাটা পুনরায় ডিক্রিপ্ট বা পড়ার উপযোগী করার ফাংশন
     * @param {Object} encryptionData - { iv, encryptedData } অবজেক্ট
     * @param {string} [secretKey] - কাস্টম কি (ঐচ্ছিক)
     */
    decrypt: (encryptionData, secretKey) => {
        try {
            const iv = Buffer.from(encryptionData.iv, 'hex');
            const key = getKey(secretKey || process.env.ENCRYPTION_KEY || 'rorraxy-default-secure-32-byte-key!!');
            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            
            let decrypted = decipher.update(encryptionData.encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return { success: true, data: decrypted };
        } catch (error) {
            console.error('[Decryption Error]:', error.message);
            return { success: false, error: 'Decryption failed. Invalid key or corrupted data.' };
        }
    }
};

module.exports = encryptionHelper;
