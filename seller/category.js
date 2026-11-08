/* ========================================================================== */
/* rorraxy - Modular Category JavaScript Data & Interaction Controller         */
/* ========================================================================== */

const subCategoriesData = {
    womens: [
        {name: "CLOTHING", icon: "fa-solid fa-shirt", key: "women-clothing"},
        {name: "HANDBAGS", icon: "fa-solid fa-bag-shopping", key: "women-handbags"},
        {name: "SHOES", icon: "fa-solid fa-shoe-prints", key: "women-shoes"},
        {name: "JEWELRY", icon: "fa-solid fa-gem", key: "women-jewelry"},
        {name: "WATCHES", icon: "fa-solid fa-clock", key: "women-watches"},
        {name: "LINGERIE", icon: "fa-solid fa-heart", key: "women-lingerie"},
        {name: "ACTIVEWEAR", icon: "fa-solid fa-person-running", key: "women-activewear"},
        {name: "TRADITIONAL", icon: "fa-solid fa-vest", key: "women-traditional"},
        {name: "CRAFTS & ACCENTS", icon: "fa-solid fa-feather", key: "women-crafts"},
        {name: "ACCESSORIES", icon: "fa-solid fa-glasses", key: "women-accessories"}
    ],
    mens: [
        {name: "MEN CLOTHING", icon: "fa-solid fa-shirt", key: "men-clothing"},
        {name: "MEN SHOES", icon: "fa-solid fa-shoe-prints", key: "men-shoes"},
        {name: "MEN WATCHES", icon: "fa-solid fa-clock", key: "men-watches"},
        {name: "GROOMING & WALLETS", icon: "fa-solid fa-wallet", key: "men-grooming"},
        {name: "MEN ACCESSORIES", icon: "fa-solid fa-glasses", key: "men-accessories"}
    ],
    girls: [
        {name: "GIRLS CLOTHING", icon: "fa-solid fa-child-dress", key: "girls-clothing"},
        {name: "GIRLS SHOES", icon: "fa-solid fa-shoe-prints", key: "girls-shoes"},
        {name: "GIRLS BAGS", icon: "fa-solid fa-bag-shopping", key: "girls-bags"},
        {name: "GIRLS JEWELRY", icon: "fa-solid fa-gem", key: "girls-jewelry"},
        {name: "GIRLS WATCHES", icon: "fa-solid fa-clock", key: "girls-watches"},
        {name: "HAIR ACCESSORIES", icon: "fa-solid fa-crown", key: "girls-hair-accessories"},
        {name: "ACTIVEWEAR", icon: "fa-solid fa-person-running", key: "girls-activewear"},
        {name: "SLEEPWEAR", icon: "fa-solid fa-bed", key: "girls-sleepwear"},
        {name: "PARTY DRESSES", icon: "fa-solid fa-wand-magic-sparkles", key: "girls-party-dresses"},
        {name: "GIRLS ACCESSORIES", icon: "fa-solid fa-glasses", key: "girls-accessories"}
    ],
    boys: [
        {name: "BOYS CLOTHING", icon: "fa-solid fa-child", key: "boys-clothing"},
        {name: "BOYS SHOES", icon: "fa-solid fa-shoe-prints", key: "boys-shoes"},
        {name: "BOYS WATCHES", icon: "fa-solid fa-clock", key: "boys-watches"},
        {name: "BAGS & WALLETS", icon: "fa-solid fa-bag-shopping", key: "boys-bags"},
        {name: "BOYS ACCESSORIES", icon: "fa-solid fa-glasses", key: "boys-accessories"}
    ],
    matching: [
        {name: "COUPLE SETS", icon: "fa-solid fa-people-arrows", key: "couple-matchingsets"},
        {name: "FAMILY SETS", icon: "fa-solid fa-people-group", key: "family-matchingsets"},
        {name: "MOM & ME SETS", icon: "fa-solid fa-child-reaching", key: "mom-me-sets"},
        {name: "DAD & ME SETS", icon: "fa-solid fa-user-gear", key: "dad-me-sets"},
        {name: "SIBLING SETS", icon: "fa-solid fa-children", key: "sibling-matchingsets"},
        {name: "TEAM SETS", icon: "fa-solid fa-users", key: "team-matchingsets"},
        {name: "BFF SETS", icon: "fa-solid fa-handshake-angle", key: "bff-matchingsets"},
        {name: "PET & OWNER SETS", icon: "fa-solid fa-paw", key: "pet-owner-sets"},
        {name: "HOLIDAY SETS", icon: "fa-solid fa-holly-berry", key: "holiday-matchingsets"},
        {name: "VALUE BUNDLES", icon: "fa-solid fa-boxes-stacked", key: "value-bundles"}
    ],
    luxury: [
        {name: "CORPORATE GIFTS", icon: "fa-solid fa-briefcase", key: "corporate-gifts"},
        {name: "LUXURY GIFT ITEMS", icon: "fa-solid fa-gem", key: "luxury-giftitems"},
        {name: "PREMIUM HANDICRAFTS", icon: "fa-solid fa-hand-holding-heart", key: "premium-handicrafts"},
        {name: "WOOD & RESIN CRAFTS", icon: "fa-solid fa-tree", key: "wood-resincrafts"},
        {name: "BAMBOO & BRASS DECOR", icon: "fa-solid fa-seedling", key: "bamboo-brass-decor"},
        {name: "GIFT SETS & HAMPERS", icon: "fa-solid fa-gift", key: "gift-sets-hampers"}
    ],
    baby: [
        {name: "MOTHER & BABY CLOTHING", icon: "fa-solid fa-shirt", key: "mother-baby-clothing"},
        {name: "PREGNANCY & MATERNITY", icon: "fa-solid fa-venus", key: "pregnancy-maternity"},
        {name: "BABY CARE & FEEDING", icon: "fa-solid fa-bottle-water", key: "baby-care-feeding"},
        {name: "Nursery & Baby Gear", icon: "fa-solid fa-bed", key: "nursery-baby-gear"},
        {name: "ECO BABY TOYS", icon: "fa-solid fa-puzzle-piece", key: "eco-baby-toys"},
        {name: "ACCESSORIES", icon: "fa-solid fa-glasses", key: "mother-baby-accessories"}
    ]
};

function showSubCategories(element, categoryKey) {
    document.querySelectorAll('#main-categories .cat-box').forEach(box => box.classList.remove('clicked'));
    element.classList.add('clicked');

    const mainCategoriesEl = document.getElementById('main-categories');
    const subContainer = document.getElementById('sub-categories');
    
    if (mainCategoriesEl) mainCategoriesEl.style.display = 'none';
    if (subContainer) subContainer.style.display = 'block';

    const contentDiv = document.getElementById('sub-cat-content');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = '';

    const list = subCategoriesData[categoryKey] || [];
    list.forEach(item => {
        const box = document.createElement('div');
        box.className = 'cat-box';
        box.onclick = () => {
            document.querySelectorAll('#sub-cat-content .cat-box').forEach(b => b.classList.remove('clicked'));
            box.classList.add('clicked');
            window.selectedCategoryValue = item.key || item.name;
            
            // Automatically advance to step 3 (Media) on subcategory click
            setTimeout(() => { 
                if (typeof nextUploadStep === 'function') {
                    nextUploadStep(3);
                } else if (typeof nextStep === 'function') {
                    nextStep(3);
                }
            }, 180);
        };
        box.innerHTML = `<i class="${item.icon}"><span>${item.name}</span></i>`;
        contentDiv.appendChild(box);
    });
}

function backToMainCategories() {
    const subContainer = document.getElementById('sub-categories');
    const mainCategoriesEl = document.getElementById('main-categories');

    if (subContainer) subContainer.style.display = 'none';
    if (mainCategoriesEl) mainCategoriesEl.style.display = 'grid';
    
    document.querySelectorAll('#main-categories .cat-box').forEach(box => box.classList.remove('clicked'));
    window.selectedCategoryValue = "";
}
