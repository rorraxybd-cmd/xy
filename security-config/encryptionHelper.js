/**
 * rorraxy Ecosystem - Client-Side Advanced Encryption & Security Helper
 */

(function () {
    'use strict';

    class RorraxyEncryptionManager {
        constructor() {
            this.algo = "AES-GCM";
            this.keyLength = 256;
        }

        async #getKey(secretKeyString) {
            const encoder = new TextEncoder();
            const keyMaterial = await window.crypto.subtle.importKey(
                "raw",
                encoder.encode(secretKeyString.padEnd(32, '0').slice(0, 32)),
                { name: "PBKDF2" },
                false,
                ["deriveKey"]
            );

            return window.crypto.subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: encoder.encode("rorraxy_secure_salt_v1"),
                    iterations: 100000,
                    hash: "SHA-256"
                },
                keyMaterial,
                { name: this.algo, length: this.keyLength },
                false,
                ["encrypt", "decrypt"]
            );
        }

        async encrypt(plainText, secretKeyString = "rorraxy_master_default_secret") {
            try {
                if (!plainText) return null;
                const text = typeof plainText === 'object' ? JSON.stringify(plainText) : String(plainText);
                
                const key = await this.#getKey(secretKeyString);
                const iv = window.crypto.getRandomValues(new Uint8Array(12));
                const encoded = new TextEncoder().encode(text);

                const encryptedContent = await window.crypto.subtle.encrypt(
                    { name: this.algo, iv: iv },
                    key,
                    encoded
                );

                const buffer = new Uint8Array(encryptedContent);
                const combined = new Uint8Array(iv.length + buffer.length);
                combined.set(iv);
                combined.set(buffer, iv.length);

                return btoa(String.fromCharCode(...combined));
            } catch (error) {
                console.error("Encryption Failed:", error);
                return null;
            }
        }

        async decrypt(encryptedBase64, secretKeyString = "rorraxy_master_default_secret") {
            try {
                if (!encryptedBase64) return null;
                
                const key = await this.#getKey(secretKeyString);
                const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
                
                const iv = combined.slice(0, 12);
                const data = combined.slice(12);

                const decryptedContent = await window.crypto.subtle.decrypt(
                    { name: this.algo, iv: iv },
                    key,
                    data
                );

                const decodedString = new TextDecoder().decode(decryptedContent);
                try {
                    return JSON.parse(decodedString);
                } catch {
                    return decodedString;
                }
            } catch (error) {
                console.error("Decryption Failed (Invalid Key or Corrupted Data):", error);
                return null;
            }
        }

        async hashSHA256(message) {
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(message);
                const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } catch (error) {
                console.error("Hashing Failed:", error);
                return null;
            }
        }

        async setSecureItem(key, value, secretKey = "rorraxy_master_default_secret", isSession = false) {
            const encrypted = await this.encrypt(value, secretKey);
            if (encrypted) {
                const storage = isSession ? sessionStorage : localStorage;
                storage.setItem(`sec_${key}`, encrypted);
                return true;
            }
            return false;
        }

        async getSecureItem(key, secretKey = "rorraxy_master_default_secret", isSession = false) {
            const storage = isSession ? sessionStorage : localStorage;
            const encrypted = storage.getItem(`sec_${key}`);
            if (!encrypted) return null;
            return await this.decrypt(encrypted, secretKey);
        }
    }

    window.RorraxyEncryption = new RorraxyEncryptionManager();
})();
