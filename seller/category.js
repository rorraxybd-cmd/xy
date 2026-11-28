/* ========================================================================== */
/* rorraxy - Seller Flat Category Data & Interaction Controller             */
/* ========================================================================== */

const rorraxySellerCategories = [
    { name: "WATCHES", icon: "fa-solid fa-clock", key: "watches" },
    { name: "JEWELRY", icon: "fa-solid fa-gem", key: "jewelry" },
    { name: "BRACELETS", icon: "fa-solid fa-ring", key: "bracelets" },
    { name: "CLOCKS", icon: "fa-solid fa-clock-rotate-left", key: "clocks" },
    { name: "LAMPS & LIGHTING", icon: "fa-solid fa-lightbulb", key: "lamps-lighting" },
    { name: "WALL ART & DECOR", icon: "fa-solid fa-image", key: "wall-art-decor" },
    { name: "LUXURY GIFTS", icon: "fa-solid fa-gift", key: "luxury-gifts" },
    { name: "ACCESSORIES", icon: "fa-solid fa-sparkles", key: "accessories" }
];

function renderSellerCategories(containerId = 'main-categories') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    rorraxySellerCategories.forEach(item => {
        const box = document.createElement('div');
        box.className = 'cat-box';
        box.dataset.categoryKey = item.key;

        box.onclick = () => {
            document.querySelectorAll(`#${containerId} .cat-box`).forEach(b => b.classList.remove('clicked'));
            box.classList.add('clicked');

            window.selectedCategoryValue = item.key || item.name;

            const hiddenInput = document.getElementById('selected-category-input');
            if (hiddenInput) {
                hiddenInput.value = window.selectedCategoryValue;
            }

            setTimeout(() => {
                if (typeof nextUploadStep === 'function') {
                    nextUploadStep(3);
                } else if (typeof nextStep === 'function') {
                    nextStep(3);
                }
            }, 180);
        };

        box.innerHTML = `<i class="${item.icon}"><span>${item.name}</span></i>`;
        container.appendChild(box);
    });
}

// Backward-compatible wrapper in case any HTML still calls showSubCategories
function showSubCategories(element, categoryKey) {
    if (element) {
        document.querySelectorAll('#main-categories .cat-box').forEach(box => box.classList.remove('clicked'));
        element.classList.add('clicked');
    }

    window.selectedCategoryValue = categoryKey || '';

    setTimeout(() => {
        if (typeof nextUploadStep === 'function') {
            nextUploadStep(3);
        } else if (typeof nextStep === 'function') {
            nextStep(3);
        }
    }, 180);
}

function backToMainCategories() {
    const subContainer = document.getElementById('sub-categories');
    const mainCategoriesEl = document.getElementById('main-categories');

    if (subContainer) subContainer.style.display = 'none';
    if (mainCategoriesEl) mainCategoriesEl.style.display = 'grid';

    document.querySelectorAll('#main-categories .cat-box').forEach(box => box.classList.remove('clicked'));
    window.selectedCategoryValue = '';
}

document.addEventListener('DOMContentLoaded', () => {
    renderSellerCategories('main-categories');
});
