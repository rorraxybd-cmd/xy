// categories.js - সমস্ত ক্যাটাগরি এবং সাব-ক্যাটাগরির ডেটা
const rorraxyCategoriesData = [
    {
        id: "cat-women",
        title: "WOMEN'S FASHION",
        icon: "fa-solid fa-person-dress",
        subCategories: [
            { name: "CLOTHING", key: "women-clothing", icon: "fa-solid fa-shirt" },
            { name: "HANDBAGS", key: "women-handbags", icon: "fa-solid fa-bag-shopping" },
            { name: "SHOES", key: "women-shoes", icon: "fa-solid fa-shoe-prints" },
            { name: "JEWELRY", key: "women-jewelry", icon: "fa-solid fa-gem" },
            { name: "WATCHES", key: "women-watches", icon: "fa-solid fa-clock" },
            { name: "LINGERIE", key: "women-lingerie", icon: "fa-solid fa-heart" },
            { name: "ACTIVEWEAR", key: "women-activewear", icon: "fa-solid fa-person-running" },
            { name: "TRADITIONAL", key: "women-traditional", icon: "fa-solid fa-vest" },
            { name: "CRAFTS & ACCENTS", key: "women-crafts", icon: "fa-solid fa-feather" },
            { name: "ACCESSORIES", key: "women-accessories", icon: "fa-solid fa-glasses" }
        ]
    },
    {
        id: "cat-men",
        title: "MEN'S FASHION",
        icon: "fa-solid fa-user-tie",
        subCategories: [
            { name: "MEN CLOTHING", key: "men-clothing", icon: "fa-solid fa-shirt" },
            { name: "MEN SHOES", key: "men-shoes", icon: "fa-solid fa-shoe-prints" },
            { name: "MEN WATCHES", key: "men-watches", icon: "fa-solid fa-clock" },
            { name: "GROOMING & WALLETS", key: "men-grooming", icon: "fa-solid fa-wallet" },
            { name: "MEN ACCESSORIES", key: "men-accessories", icon: "fa-solid fa-glasses" }
        ]
    },
    {
        id: "cat-girls",
        title: "GIRLS' FASHION",
        icon: "fa-solid fa-crown",
        subCategories: [
            { name: "GIRLS CLOTHING", key: "girls-clothing", icon: "fa-solid fa-child-dress" },
            { name: "GIRLS SHOES", key: "girls-shoes", icon: "fa-solid fa-shoe-prints" },
            { name: "GIRLS BAGS", key: "girls-bags", icon: "fa-solid fa-bag-shopping" },
            { name: "GIRLS JEWELRY", key: "girls-jewelry", icon: "fa-solid fa-gem" },
            { name: "GIRLS WATCHES", key: "girls-watches", icon: "fa-solid fa-clock" },
            { name: "HAIR ACCESSORIES", key: "girls-hair-accessories", icon: "fa-solid fa-crown" },
            { name: "ACTIVEWEAR", key: "girls-activewear", icon: "fa-solid fa-person-running" },
            { name: "SLEEPWEAR", key: "girls-sleepwear", icon: "fa-solid fa-bed" },
            { name: "PARTY DRESSES", key: "girls-party-dresses", icon: "fa-solid fa-wand-magic-sparkles" },
            { name: "GIRLS ACCESSORIES", key: "girls-accessories", icon: "fa-solid fa-glasses" }
        ]
    },
    {
        id: "cat-boys",
        title: "BOYS' FASHION",
        icon: "fa-solid fa-child",
        subCategories: [
            { name: "BOYS CLOTHING", key: "boys-clothing", icon: "fa-solid fa-child" },
            { name: "BOYS SHOES", key: "boys-shoes", icon: "fa-solid fa-shoe-prints" },
            { name: "BOYS WATCHES", key: "boys-watches", icon: "fa-solid fa-clock" },
            { name: "BAGS & WALLETS", key: "boys-bags", icon: "fa-solid fa-bag-shopping" },
            { name: "BOYS ACCESSORIES", key: "boys-accessories", icon: "fa-solid fa-glasses" }
        ]
    },
    {
        id: "cat-matching",
        title: "MATCHING SETS",
        icon: "fa-solid fa-people-arrows",
        subCategories: [
            { name: "COUPLE SETS", key: "couple-matchingsets", icon: "fa-solid fa-people-arrows" },
            { name: "FAMILY SETS", key: "family-matchingsets", icon: "fa-solid fa-people-group" },
            { name: "MOM & ME SETS", key: "mom-me-sets", icon: "fa-solid fa-child-reaching" },
            { name: "DAD & ME SETS", key: "dad-me-sets", icon: "fa-solid fa-user-gear" },
            { name: "SIBLING SETS", key: "sibling-matchingsets", icon: "fa-solid fa-children" },
            { name: "TEAM SETS", key: "team-matchingsets", icon: "fa-solid fa-users" },
            { name: "BFF SETS", key: "bff-matchingsets", icon: "fa-solid fa-handshake-angle" },
            { name: "PET & OWNER SETS", key: "pet-owner-sets", icon: "fa-solid fa-paw" },
            { name: "HOLIDAY SETS", key: "holiday-matchingsets", icon: "fa-solid fa-holly-berry" },
            { name: "VALUE BUNDLES", key: "value-bundles", icon: "fa-solid fa-boxes-stacked" }
        ]
    },
    {
        id: "cat-gifts",
        title: "LUXURY GIFTS",
        icon: "fa-solid fa-gift",
        subCategories: [
            { name: "CORPORATE GIFTS", key: "corporate-gifts", icon: "fa-solid fa-briefcase" },
            { name: "LUXURY GIFT ITEMS", key: "luxury-giftitems", icon: "fa-solid fa-gem" },
            { name: "PREMIUM HANDICRAFTS", key: "premium-handicrafts", icon: "fa-solid fa-hand-holding-heart" },
            { name: "WOOD & RESIN CRAFTS", key: "wood-resincrafts", icon: "fa-solid fa-tree" },
            { name: "BAMBOO & BRASS DECOR", key: "bamboo-brass-decor", icon: "fa-solid fa-seedling" },
            { name: "GIFT SETS & HAMPERS", key: "gift-sets-hampers", icon: "fa-solid fa-gift" }
        ]
    },
    {
        id: "cat-mother",
        title: "MOTHER & BABY",
        icon: "fa-solid fa-baby",
        subCategories: [
            { name: "MOTHER & BABY CLOTHING", key: "mother-baby-clothing", icon: "fa-solid fa-shirt" },
            { name: "PREGNANCY & MATERNITY", key: "pregnancy-maternity", icon: "fa-solid fa-venus" },
            { name: "BABY CARE & FEEDING", key: "baby-care-feeding", icon: "fa-solid fa-bottle-water" },
            { name: "NURSERY & BABY GEAR", key: "nursery-baby-gear", icon: "fa-solid fa-bed" },
            { name: "ECO BABY TOYS", key: "eco-baby-toys", icon: "fa-solid fa-puzzle-piece" },
            { name: "ACCESSORIES", key: "mother-baby-accessories", icon: "fa-solid fa-glasses" }
        ]
    }
];
