/**
 * rorraxy Ecosystem - Superfast Client-Side Backup & Restore Manager
 * Handles localStorage and sessionStorage synchronization, JSON export, and instant recovery.
 */

class RorraxyBackupManager {
    constructor() {
        this.backupVersion = "1.0.0";
    }

    createSnapshot() {
        try {
            const localData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key.startsWith('rorraxy_ignore_')) {
                    localData[key] = localStorage.getItem(key);
                }
            }

            const sessionData = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                sessionData[key] = sessionStorage.getItem(key);
            }

            const snapshot = {
                platform: "rorraxy",
                version: this.backupVersion,
                timestamp: new Date().toISOString(),
                local_storage: localData,
                session_storage: sessionData
            };

            return snapshot;
        } catch (error) {
            console.error("Backup Snapshot Creation Failed:", error);
            return null;
        }
    }

    downloadBackupFile(filename = "rorraxy-ecosystem-backup.json") {
        const snapshot = this.createSnapshot();
        if (!snapshot) return false;

        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", filename);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            return true;
        } catch (error) {
            console.error("Backup File Download Failed:", error);
            return false;
        }
    }

    restoreFromSnapshot(snapshot) {
        try {
            if (!snapshot || snapshot.platform !== "rorraxy") {
                throw new Error("Invalid or incompatible backup file.");
            }

            if (snapshot.local_storage) {
                for (const [key, value] of Object.entries(snapshot.local_storage)) {
                    localStorage.setItem(key, value);
                }
            }

            if (snapshot.session_storage) {
                for (const [key, value] of Object.entries(snapshot.session_storage)) {
                    sessionStorage.setItem(key, value);
                }
            }

            return true;
        } catch (error) {
            console.error("Restore Failed:", error);
            return false;
        }
    }

    handleFileUpload(event, callback) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const snapshot = JSON.parse(e.target.result);
                const success = this.restoreFromSnapshot(snapshot);
                if (callback) callback(success, snapshot);
            } catch (error) {
                console.error("Error parsing backup JSON file:", error);
                if (callback) callback(false, error);
            }
        };
        reader.readAsText(file);
    }

    setItem(key, value, isSession = false) {
        const storage = isSession ? sessionStorage : localStorage;
        try {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
            storage.setItem(key, stringValue);
            return true;
        } catch (error) {
            return false;
        }
    }

    getItem(key, isSession = false) {
        const storage = isSession ? sessionStorage : localStorage;
        try {
            const item = storage.getItem(key);
            if (!item) return null;
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (error) {
            return null;
        }
    }
}

window.RorraxyBackup = new RorraxyBackupManager();
