/**
 * rorraxy - Advanced Security & Input Validator Module
 * Description: Sanitizes user inputs, prevents XSS/Injection attacks, 
 * validates global formats (emails, passwords, phone numbers), and enforces brand rules.
 */

class RorraxyValidator {
    constructor() {
        this.brandNameRule = /^[a-z0-9\-_]+$/;
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    isEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    checkPasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const isValid = password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;

        return {
            isValid,
            errors: {
                length: password.length >= minLength,
                upperCase: hasUpperCase,
                lowerCase: hasLowerCase,
                number: hasNumbers,
                specialChar: hasSpecialChar
            }
        };
    }

    isStrictBrandValid(text) {
        return this.brandNameRule.test(text);
    }

    isPhone(phone) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    validateForm(formData) {
        if (formData.email && !this.isEmail(formData.email)) {
            return { success: false, message: 'দয়া করে একটি সঠিক ইমেল অ্যাড্রেস প্রদান করুন।' };
        }

        if (formData.password) {
            const passCheck = this.checkPasswordStrength(formData.password);
            if (!passCheck.isValid) {
                return { success: false, message: 'পাসওয়ার্ডে কমপক্ষে ৮ অক্ষর, বড়-ছোট হাতের অক্ষর, সংখ্যা এবং স্পেশাল ক্যারেক্টার থাকতে হবে।' };
            }
        }

        if (formData.phone && !this.isPhone(formData.phone)) {
            return { success: false, message: 'দয়া করে কান্ট্রি কোডসহ সঠিক ফোন নম্বর প্রদান করুন।' };
        }

        for (let key in formData) {
            if (typeof formData[key] === 'string') {
                formData[key] = this.sanitizeInput(formData[key]);
            }
        }

        return { success: true, message: 'ভ্যালিডেশন সফল হয়েছে।' };
    }
}

const rorraxyValidator = new RorraxyValidator();

if (typeof window !== 'undefined') {
    window.RorraxyValidator = RorraxyValidator;
}
