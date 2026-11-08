function handlePaymentMethodChange() {
    const method = document.getElementById('paymentMethod').value;
    const container = document.getElementById('dynamicPaymentContainer');
    document.querySelectorAll('.payment-field-group').forEach(group => group.classList.remove('active'));
    if (!method) { container.style.display = 'none'; return; }
    container.style.display = 'flex';
    const activeGroup = document.getElementById(`field_${method.replace(' ', '')}`);
    if (activeGroup) activeGroup.classList.add('active');
}

window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let autoEmail = urlParams.get('email') || localStorage.getItem('rorraxy_affiliate_email') || localStorage.getItem('rorraxy_current_affiliate_email');
    
    if (!autoEmail) {
        autoEmail = "affiliate_" + Date.now() + "@rorraxy.com";
    }
    document.getElementById('email').value = autoEmail;
    localStorage.setItem('rorraxy_affiliate_email', autoEmail);

    try {
        const res = await fetch(`/api/affiliate?action=info&affiliate_id=${encodeURIComponent(autoEmail)}`);
        const result = await res.json();
        if(result.success && result.data && result.data.length > 0) {
            const dbData = result.data[0];
            if(dbData.first_name) {
                const formattedData = {
                    firstName: dbData.first_name || '',
                    lastName: dbData.last_name || '',
                    phone: dbData.phone || '',
                    promoChannel: dbData.promo_channel || '',
                    paymentMethod: dbData.payment_method || '',
                    accountDetails: dbData.account_details || ''
                };
                fillFormAndShowSummary(formattedData);
                return;
            }
        }
    } catch(err) {
        console.warn("Cloud sync fetch notice:", err);
    }

    document.getElementById('affiliateInfoForm').style.display = 'block';
    document.getElementById('infoSummaryBox').style.display = 'none';
});

function fillFormAndShowSummary(data) {
    document.getElementById('firstName').value = data.firstName || '';
    document.getElementById('lastName').value = data.lastName || '';
    document.getElementById('phone').value = data.phone || '';
    document.getElementById('promoChannel').value = data.promoChannel || '';
    document.getElementById('paymentMethod').value = data.paymentMethod || '';
    
    if(data.paymentMethod === 'bKash') {
        document.getElementById('bkashNumber').value = data.accountDetails || '';
    } else if(data.paymentMethod === 'Nagad') {
        document.getElementById('nagadNumber').value = data.accountDetails || '';
    } else {
        document.getElementById('bankAccountNumber').value = data.accountDetails || '';
    }

    handlePaymentMethodChange();
    showSummary(data);
}

async function saveAffiliateInfo(e) {
    e.preventDefault();
    
    const btn = document.getElementById('saveInfoBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SAVING...';

    const userEmail = document.getElementById('email').value.trim().toLowerCase();
    const paymentMethodVal = document.getElementById('paymentMethod').value;
    let accountDetailsVal = "N/A";

    if(paymentMethodVal === 'bKash') accountDetailsVal = document.getElementById('bkashNumber').value.trim();
    else if(paymentMethodVal === 'Nagad') accountDetailsVal = document.getElementById('nagadNumber').value.trim();
    else accountDetailsVal = document.getElementById('bankAccountNumber').value.trim();

    const data = {
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        email: userEmail,
        phone: document.getElementById('phone').value.trim(),
        promo_channel: document.getElementById('promoChannel').value.trim(),
        payment_method: paymentMethodVal,
        account_details: accountDetailsVal,
        auth_provider: "email",
        auth_id: userEmail
    };

    const cleanData = {
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        promoChannel: data.promo_channel,
        paymentMethod: data.payment_method,
        accountDetails: data.account_details
    };

    try {
        await fetch('/api/affiliate?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (err) {
        console.error("API Error:", err);
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> SAVE INFO';
    showSummary(cleanData);
}

function showSummary(data) {
    document.getElementById('sumName').innerText = `${data.firstName || ''} ${data.lastName || ''}`;
    document.getElementById('sumEmail').innerText = document.getElementById('email').value;
    document.getElementById('sumPhone').innerText = data.phone || '';
    document.getElementById('sumMethod').innerText = data.paymentMethod || '';
    document.getElementById('sumChannel').innerText = data.promoChannel || '';

    document.getElementById('affiliateInfoForm').style.display = 'none';
    document.getElementById('infoSummaryBox').style.display = 'flex';
    document.getElementById('infoCheckMark').style.display = 'inline-flex';
}

function editAffiliateInfo() {
    document.getElementById('affiliateInfoForm').style.display = 'block';
    document.getElementById('infoSummaryBox').style.display = 'none';
    document.getElementById('infoCheckMark').style.display = 'none';
}
