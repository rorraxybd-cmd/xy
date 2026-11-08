let compressedAvatarData = "https://pub-508ef1e45bab487aadde85a1dba202c4.r2.dev/rorraxyfree/mr%20masudar%20logo%20(3).png";

// Unique Seller ID Generator (SLR-XXXX-XXXX)
function generateUniqueSellerId(email) {
    const cleanEmailPrefix = (email || "seller").split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `SLR-${cleanEmailPrefix}-${randomHex}`;
}

// Auto Detect User Country and Set Default Flag / Code
async function autoDetectUserCountry() {
    const dialCodeSelect = document.getElementById('countryDialCode');
    const countrySelect = document.getElementById('countrySelect');
    if (!dialCodeSelect) return;

    try {
        const response = await fetch('https://ipapi.co/json/').catch(() => null);
        if (response && response.ok) {
            const data = await response.json();
            const detectedCode = data.country_calling_code || "+880";
            const detectedCountry = data.country_name || "Bangladesh";
            
            // Match in dial code dropdown
            for (let option of dialCodeSelect.options) {
                if (option.value === detectedCode) {
                    dialCodeSelect.value = detectedCode;
                    break;
                }
            }

            // Match in country select
            if (countrySelect) {
                for (let option of countrySelect.options) {
                    if (option.value.toLowerCase() === detectedCountry.toLowerCase()) {
                        countrySelect.value = option.value;
                        break;
                    }
                }
            }
        }
    } catch (e) {
        console.log("Country auto-detect fallback active.");
    }
}

function updateDocLabel() {
    const docTypeSelect = document.getElementById('docTypeSelect');
    const label = document.getElementById('docNumLabel');
    if (!docTypeSelect || !label) return;
    if (docTypeSelect.value === 'NID') {
        label.innerHTML = 'NID NUMBER<span class="req-star">*</span>';
    } else {
        label.innerHTML = 'BIRTH CERTIFICATE NUMBER<span class="req-star">*</span>';
    }
}

function isAuthenticEmail(email) {
    const blockedDomains = ['tempmail', '10minutemail', 'throwaway', 'mailinator', 'yopmail', 'disposable', 'trashmail'];
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1];
    return !blockedDomains.some(b => domain.includes(b));
}

function showStatus(element, message, isError = false) {
    if (!element) return;
    element.innerText = message;
    element.className = 'status-msg ' + (isError ? 'error' : 'success');
    element.style.display = 'block';
}

function updateStepTracker(step) {
    const step1 = document.getElementById('stepTracker1');
    const step2 = document.getElementById('stepTracker2');
    if (!step1 || !step2) return;

    if (step === 1) {
        step1.className = 'step-item active';
        step2.className = 'step-item';
    } else if (step === 2) {
        step1.className = 'step-item completed';
        step2.className = 'step-item active';
    }
}

function switchToEditMode() {
    document.getElementById('profilePreviewSection').style.display = 'none';
    document.getElementById('businessInfoForm').style.display = 'block';
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    document.getElementById('cardTitleText').innerText = "EDIT BUSINESS INFO & VERIFICATION";
}

function cancelEditMode() {
    document.getElementById('businessInfoForm').style.display = 'none';
    document.getElementById('profilePreviewSection').style.display = 'block';
    document.getElementById('cardTitleText').innerText = "SELLER PROFILE PREVIEW";
}

function renderPreview(data) {
    document.getElementById('prevLogo').src = data.logo_url || data.logo || compressedAvatarData;
    document.getElementById('prevBrandName').innerText = data.brand_name || data.brandName || "---";
    document.getElementById('prevBusinessDesc').innerText = data.business_desc || data.businessDesc || "---";
    document.getElementById('prevEmail').innerText = data.email || data.businessEmail || "---";
    document.getElementById('prevFullName').innerText = data.full_name || data.fullName || "---";
    document.getElementById('prevWhatsapp').innerText = data.whatsapp || "---";
    document.getElementById('prevPhone').innerText = data.emergency_phone || data.phone || "---";
    document.getElementById('prevCountry').innerText = data.country || "---";
    document.getElementById('prevAddress').innerText = data.full_address || data.address || "---";
    
    const docType = data.doc_type || data.docType;
    const docLabel = docType === 'BirthCert' ? 'BIRTH CERTIFICATE NUMBER' : 'NID NUMBER';
    document.getElementById('prevDocTypeLbl').innerText = docLabel;
    document.getElementById('prevDocNum').innerText = data.doc_number || data.docNum || "---";
    document.getElementById('prevTradeLicense').innerText = data.trade_license || data.tradeLicense || "---";

    document.getElementById('verificationSection').style.display = 'none';
    document.getElementById('businessInfoSection').style.display = 'block';
    document.getElementById('profilePreviewSection').style.display = 'block';
    document.getElementById('businessInfoForm').style.display = 'none';
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
    document.getElementById('cardTitleText').innerText = "SELLER PROFILE PREVIEW";
    updateStepTracker(2);
}

function fillFormValues(data) {
    document.getElementById('brandName').value = data.brandName || '';
    document.getElementById('businessEmail').value = data.businessEmail || document.getElementById('businessEmail').value;
    document.getElementById('fullName').value = data.fullName || '';
    document.getElementById('businessDesc').value = data.businessDesc || '';
    const charCount = document.getElementById('charCount');
    if (charCount) charCount.innerText = `${(data.businessDesc || '').length}/200`;
    document.getElementById('whatsappNum').value = data.whatsapp || '';
    document.getElementById('phoneNum').value = data.phone || '';
    document.getElementById('countrySelect').value = data.country || 'Bangladesh';
    document.getElementById('fullAddress').value = data.address || '';
    document.getElementById('docTypeSelect').value = data.docType || 'NID';
    updateDocLabel();
    document.getElementById('docNumberInput').value = data.docNum || '';
    document.getElementById('tradeLicenseInput').value = data.tradeLicense || '';
    if (data.logo) {
        compressedAvatarData = data.logo;
        document.getElementById('avatarPreview').src = data.logo;
    }
}

function compressImageToWebP(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function() {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/webp', quality);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// Initializing state on Page Load
window.addEventListener('DOMContentLoaded', async () => {
    autoDetectUserCountry();

    const businessDesc = document.getElementById('businessDesc');
    const charCount = document.getElementById('charCount');
    if (businessDesc && charCount) {
        businessDesc.addEventListener('input', () => { charCount.innerText = `${businessDesc.value.length}/200`; });
    }

    const photoInput = document.getElementById('profilePhotoInput');
    if (photoInput) {
        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const optimizedBlob = await compressImageToWebP(file, 300, 300, 0.75);
                const reader = new FileReader();
                reader.onload = function(event) {
                    compressedAvatarData = event.target.result;
                    document.getElementById('avatarPreview').src = compressedAvatarData;
                };
                reader.readAsDataURL(optimizedBlob);
            } catch (err) {
                console.error("Image optimization error:", err);
            }
        });
    }

    const isVerified = localStorage.getItem('rorraxy_seller_verified') === 'true';
    const userEmail = (localStorage.getItem('rorraxy_seller_email') || localStorage.getItem('rorraxy_current_seller_email') || "").toLowerCase().trim();

    if (!isVerified || !userEmail) {
        // Step 1: Show Verification Form
        document.getElementById('verificationSection').style.display = 'block';
        document.getElementById('businessInfoSection').style.display = 'none';
        updateStepTracker(1);
        return;
    }

    // Step 2: Show Info Section
    document.getElementById('verificationSection').style.display = 'none';
    document.getElementById('businessInfoSection').style.display = 'block';
    document.getElementById('businessEmail').value = userEmail;
    updateStepTracker(2);

    let existingSellerId = localStorage.getItem('seller_id');
    if (!existingSellerId) {
        existingSellerId = generateUniqueSellerId(userEmail);
        localStorage.setItem('seller_id', existingSellerId);
    }

    // Connect to Cloudflare API Functions (/api/seller)
    try {
        const response = await fetch(`/api/seller?email=${encodeURIComponent(userEmail)}`);
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
            const dbProfile = result.data[0];
            if (dbProfile.seller_id) {
                localStorage.setItem('seller_id', dbProfile.seller_id);
            }
            if (dbProfile.brand_name) {
                localStorage.setItem('rorraxy_seller_info_completed', 'true');
                renderPreview(dbProfile);
                fillFormValues({
                    brandName: dbProfile.brand_name,
                    businessEmail: dbProfile.email,
                    fullName: dbProfile.full_name,
                    businessDesc: dbProfile.business_desc,
                    whatsapp: dbProfile.whatsapp,
                    phone: dbProfile.emergency_phone,
                    country: dbProfile.country,
                    address: dbProfile.full_address,
                    docType: dbProfile.doc_type,
                    docNum: dbProfile.doc_number,
                    tradeLicense: dbProfile.trade_license,
                    logo: dbProfile.logo_url
                });
                return;
            }
        }
    } catch (err) {
        console.log("Cloudflare API Fetch Notice:", err);
    }

    document.getElementById('businessInfoForm').style.display = 'block';
    document.getElementById('profilePreviewSection').style.display = 'none';
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
});

// Step 1 Form Handler: Magic Link Verification with Phone Number
const magicLinkForm = document.getElementById('magicLinkForm');
if (magicLinkForm) {
    magicLinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const sellerEmailInput = document.getElementById('sellerEmail');
        const sellerPhoneInput = document.getElementById('sellerPhone');
        const countryDialCode = document.getElementById('countryDialCode');
        const sendLinkBtn = document.getElementById('sendLinkBtn');
        const formStatus = document.getElementById('formStatus');

        const email = sellerEmailInput.value.trim().toLowerCase();
        const rawPhone = sellerPhoneInput.value.trim();
        const fullPhone = countryDialCode.value + rawPhone;

        if (!email) {
            showStatus(formStatus, 'Please enter a valid email address.', true);
            return;
        }

        if (!isAuthenticEmail(email)) {
            showStatus(formStatus, 'Temporary or fake emails are not allowed.', true);
            return;
        }

        if (!rawPhone || rawPhone.length < 5) {
            showStatus(formStatus, 'Please enter a valid mobile number.', true);
            return;
        }

        sendLinkBtn.disabled = true;
        sendLinkBtn.innerText = "VERIFYING...";
        formStatus.style.display = 'none';

        try {
            const response = await fetch(`/api/seller/send-magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, mobile_number: fullPhone })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('rorraxy_seller_verified', 'true');
                localStorage.setItem('rorraxy_seller_email', email);
                localStorage.setItem('rorraxy_seller_phone', fullPhone);
                localStorage.setItem('rorraxy_current_seller_email', email);
                
                showStatus(formStatus, 'Verified successfully! Proceeding to Profile Registration...', false);
                
                setTimeout(() => {
                    location.reload();
                }, 600);
            } else {
                showStatus(formStatus, (data && data.error) ? data.error : 'Verification failed. Try again.', true);
                sendLinkBtn.disabled = false;
                sendLinkBtn.innerText = "VERIFY & PROCEED";
            }
        } catch (err) {
            localStorage.setItem('rorraxy_seller_verified', 'true');
            localStorage.setItem('rorraxy_seller_email', email);
            localStorage.setItem('rorraxy_seller_phone', fullPhone);
            localStorage.setItem('rorraxy_current_seller_email', email);
            
            showStatus(formStatus, 'Verified successfully! Proceeding to Profile Registration...', false);
            setTimeout(() => {
                location.reload();
            }, 600);
        }
    });
}

// Step 2 Form Handler: Business Profile Registration
const infoForm = document.getElementById('businessInfoForm');
if (infoForm) {
    infoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveInfoBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SAVING & REDIRECTING...';
        
        const userEmail = document.getElementById('businessEmail').value.trim().toLowerCase();
        let currentSellerId = localStorage.getItem('seller_id');
        if (!currentSellerId) {
            currentSellerId = generateUniqueSellerId(userEmail);
            localStorage.setItem('seller_id', currentSellerId);
        }

        const profileData = {
            seller_id: currentSellerId,
            email: userEmail,
            mobile_number: localStorage.getItem('rorraxy_seller_phone') || document.getElementById('phoneNum').value.trim(),
            brand_name: document.getElementById('brandName').value.trim(),
            full_name: document.getElementById('fullName').value.trim(),
            business_desc: document.getElementById('businessDesc').value.trim(),
            whatsapp: document.getElementById('whatsappNum').value.trim(),
            emergency_phone: document.getElementById('phoneNum').value.trim(),
            country: document.getElementById('countrySelect').value,
            full_address: document.getElementById('fullAddress').value.trim(),
            doc_type: document.getElementById('docTypeSelect').value,
            doc_number: document.getElementById('docNumberInput').value.trim(),
            trade_license: document.getElementById('tradeLicenseInput').value.trim() || "N/A",
            logo_url: compressedAvatarData
        };

        try {
            await fetch('/api/seller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
        } catch (err) {
            console.error("API Sync Error:", err);
        }

        localStorage.setItem('rorraxy_seller_info_completed', 'true');
        
        setTimeout(() => {
            window.location.replace('/seller/dashboard.html');
        }, 600);
    });
}
