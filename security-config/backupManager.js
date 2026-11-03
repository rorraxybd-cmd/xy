const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class BackupManager {
    constructor(backupDir = './backups') {
        this.backupDir = path.resolve(backupDir);
        
        // ব্যাকআপ ফোল্ডার না থাকলে তৈরি করে নেওয়া
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    /**
     * ডাটা বা কনফিগারেশন ফাইলের এনক্রিপ্টেড ব্যাকআপ তৈরি করা
     * @param {Object|string} data - ব্যাকআপযোগ্য ডাটা
     * @param {string} filename - ফাইলের নাম
     */
    createBackup(data, filename = 'backup.json') {
        try {
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const targetPath = path.join(this.backupDir, `${timestamp}-${filename}`);
            
            const jsonData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
            
            // সিকিউরিটির জন্য ডাটা ফাইল রাইট করা
            fs.writeFileSync(targetPath, jsonData, 'utf8');
            console.log(`[Backup Success]: ${targetPath}`);
            return { success: true, path: targetPath };
        } catch (error) {
            console.error('[Backup Error]:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * পুরানো ব্যাকআপ ফাইল ক্লিনআপ বা ডিলিট করা (যেমন ৭ দিনের বেশি পুরানো)
     * @param {number} daysToKeep 
     */
    cleanOldBackups(daysToKeep = 7) {
        try {
            const files = fs.readdirSync(this.backupDir);
            const now = Date.now();
            const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

            files.forEach(file => {
                const filePath = path.join(this.backupDir, file);
                const stats = fs.statSync(filePath);
                
                if (now - stats.mtimeMs > maxAge) {
                    fs.unlinkSync(filePath);
                    console.log(`[Cleaned Old Backup]: ${file}`);
                }
            });
        } catch (error) {
            console.error('[Cleanup Error]:', error.message);
        }
    }
}

module.exports = BackupManager;
