const WORLD_COUNTRIES = [
    { code: "af", name: "AFGHANISTAN", dial: "+93", flag: "🇦🇫" },
    { code: "al", name: "ALBANIA", dial: "+355", flag: "🇦🇱" },
    { code: "dz", name: "ALGERIA", dial: "+213", flag: "🇩🇿" },
    { code: "ad", name: "ANDORRA", dial: "+376", flag: "🇦🇩" },
    { code: "ao", name: "ANGOLA", dial: "+244", flag: "🇦🇴" },
    { code: "ag", name: "ANTIGUA AND BARBUDA", dial: "+1-268", flag: "🇦🇬" },
    { code: "ar", name: "ARGENTINA", dial: "+54", flag: "🇦🇷" },
    { code: "am", name: "ARMENIA", dial: "+374", flag: "🇦🇲" },
    { code: "au", name: "AUSTRALIA", dial: "+61", flag: "🇦🇺" },
    { code: "at", name: "AUSTRIA", dial: "+43", flag: "🇦🇹" },
    { code: "az", name: "AZERBAIJAN", dial: "+994", flag: "🇦🇿" },
    { code: "bs", name: "BAHAMAS", dial: "+1-242", flag: "🇧🇸" },
    { code: "bh", name: "BAHRAIN", dial: "+973", flag: "🇧🇭" },
    { code: "bd", name: "BANGLADESH", dial: "+880", flag: "🇧🇩" },
    { code: "bb", name: "BARBADOS", dial: "+1-246", flag: "🇧🇧" },
    { code: "by", name: "BELARUS", dial: "+375", flag: "🇧🇾" },
    { code: "be", name: "BELGIUM", dial: "+32", flag: "🇧🇪" },
    { code: "bz", name: "BELIZE", dial: "+501", flag: "🇧🇿" },
    { code: "bj", name: "BENIN", dial: "+229", flag: "🇧🇯" },
    { code: "bt", name: "BHUTAN", dial: "+975", flag: "🇧🇹" },
    { code: "bo", name: "BOLIVIA", dial: "+591", flag: "🇧🇴" },
    { code: "ba", name: "BOSNIA AND HERZEGOVINA", dial: "+387", flag: "🇧🇦" },
    { code: "bw", name: "BOTSWANA", dial: "+267", flag: "🇧🇼" },
    { code: "br", name: "BRAZIL", dial: "+55", flag: "🇧🇷" },
    { code: "bn", name: "BRUNEI", dial: "+673", flag: "🇧🇳" },
    { code: "bg", name: "BULGARIA", dial: "+359", flag: "🇧🇬" },
    { code: "bf", name: "BURKINA FASO", dial: "+226", flag: "🇧🇫" },
    { code: "bi", name: "BURUNDI", dial: "+257", flag: "🇧🇮" },
    { code: "cv", name: "CABO VERDE", dial: "+238", flag: "🇨🇻" },
    { code: "kh", name: "CAMBODIA", dial: "+855", flag: "🇰🇭" },
    { code: "cm", name: "CAMEROON", dial: "+237", flag: "🇨🇲" },
    { code: "ca", name: "CANADA", dial: "+1", flag: "🇨🇦" },
    { code: "cf", name: "CENTRAL AFRICAN REPUBLIC", dial: "+236", flag: "🇨🇫" },
    { code: "td", name: "CHAD", dial: "+235", flag: "🇹🇩" },
    { code: "cl", name: "CHILE", dial: "+56", flag: "🇨🇱" },
    { code: "cn", name: "CHINA", dial: "+86", flag: "🇨🇳" },
    { code: "co", name: "COLOMBIA", dial: "+57", flag: "🇨🇴" },
    { code: "km", name: "COMOROS", dial: "+269", flag: "🇰🇲" },
    { code: "cg", name: "CONGO", dial: "+242", flag: "🇨🇬" },
    { code: "cd", name: "CONGO (DRC)", dial: "+243", flag: "🇨🇩" },
    { code: "cr", name: "COSTA RICA", dial: "+506", flag: "🇨🇷" },
    { code: "ci", name: "COTE D'IVOIRE", dial: "+225", flag: "🇨🇮" },
    { code: "hr", name: "CROATIA", dial: "+385", flag: "🇭🇷" },
    { code: "cu", name: "CUBA", dial: "+53", flag: "🇨🇺" },
    { code: "cy", name: "CYPRUS", dial: "+357", flag: "🇨🇾" },
    { code: "cz", name: "CZECH REPUBLIC", dial: "+420", flag: "🇨🇿" },
    { code: "dk", name: "DENMARK", dial: "+45", flag: "🇩🇰" },
    { code: "dj", name: "DJIBOUTI", dial: "+253", flag: "🇩🇯" },
    { code: "dm", name: "DOMINICA", dial: "+1-767", flag: "🇩🇲" },
    { code: "do", name: "DOMINICAN REPUBLIC", dial: "+1-809", flag: "🇩🇴" },
    { code: "ec", name: "ECUADOR", dial: "+593", flag: "🇪🇨" },
    { code: "eg", name: "EGYPT", dial: "+20", flag: "🇪🇬" },
    { code: "sv", name: "EL SALVADOR", dial: "+503", flag: "🇸🇻" },
    { code: "gq", name: "EQUATORIAL GUINEA", dial: "+240", flag: "🇬🇶" },
    { code: "er", name: "ERITREA", dial: "+291", flag: "🇪🇷" },
    { code: "ee", name: "ESTONIA", dial: "+372", flag: "🇪🇪" },
    { code: "sz", name: "ESWATINI", dial: "+268", flag: "🇸🇿" },
    { code: "et", name: "ETHIOPIA", dial: "+251", flag: "🇪🇹" },
    { code: "fj", name: "FIJI", dial: "+679", flag: "🇫🇯" },
    { code: "fi", name: "FINLAND", dial: "+358", flag: "🇫🇮" },
    { code: "fr", name: "FRANCE", dial: "+33", flag: "🇫🇷" },
    { code: "ga", name: "GABON", dial: "+241", flag: "🇬🇦" },
    { code: "gm", name: "GAMBIA", dial: "+220", flag: "🇬🇲" },
    { code: "ge", name: "GEORGIA", dial: "+995", flag: "🇬🇪" },
    { code: "de", name: "GERMANY", dial: "+49", flag: "🇩🇪" },
    { code: "gh", name: "GHANA", dial: "+233", flag: "🇬🇭" },
    { code: "gr", name: "GREECE", dial: "+30", flag: "🇬🇷" },
    { code: "gd", name: "GRENADA", dial: "+1-473", flag: "🇬🇩" },
    { code: "gt", name: "GUATEMALA", dial: "+502", flag: "🇬🇹" },
    { code: "gn", name: "GUINEA", dial: "+224", flag: "🇬🇳" },
    { code: "gw", name: "GUINEA-BISSAU", dial: "+245", flag: "🇬🇼" },
    { code: "gy", name: "GUYANA", dial: "+592", flag: "🇬🇾" },
    { code: "ht", name: "HAITI", dial: "+509", flag: "🇭🇹" },
    { code: "hn", name: "HONDURAS", dial: "+504", flag: "🇭🇳" },
    { code: "hk", name: "HONG KONG", dial: "+852", flag: "🇭🇰" },
    { code: "hu", name: "HUNGARY", dial: "+36", flag: "🇭🇺" },
    { code: "is", name: "ICELAND", dial: "+354", flag: "🇮🇸" },
    { code: "in", name: "INDIA", dial: "+91", flag: "🇮🇳" },
    { code: "id", name: "INDONESIA", dial: "+62", flag: "🇮🇩" },
    { code: "ir", name: "IRAN", dial: "+98", flag: "🇮🇷" },
    { code: "iq", name: "IRAQ", dial: "+964", flag: "🇮🇶" },
    { code: "ie", name: "IRELAND", dial: "+353", flag: "🇮🇪" },
    { code: "il", name: "ISRAEL", dial: "+972", flag: "🇮🇱" },
    { code: "it", name: "ITALY", dial: "+39", flag: "🇮🇹" },
    { code: "jm", name: "JAMAICA", dial: "+1-876", flag: "🇯🇲" },
    { code: "jp", name: "JAPAN", dial: "+81", flag: "🇯🇵" },
    { code: "jo", name: "JORDAN", dial: "+962", flag: "🇯🇴" },
    { code: "kz", name: "KAZAKHSTAN", dial: "+7", flag: "🇰🇿" },
    { code: "ke", name: "KENYA", dial: "+254", flag: "🇰🇪" },
    { code: "ki", name: "KIRIBATI", dial: "+686", flag: "🇰🇮" },
    { code: "kw", name: "KUWAIT", dial: "+965", flag: "🇰🇼" },
    { code: "kg", name: "KYRGYZSTAN", dial: "+996", flag: "🇰🇬" },
    { code: "la", name: "LAOS", dial: "+856", flag: "🇱🇦" },
    { code: "lv", name: "LATVIA", dial: "+371", flag: "🇱🇻" },
    { code: "lb", name: "LEBANON", dial: "+961", flag: "🇱🇧" },
    { code: "ls", name: "LESOTHO", dial: "+266", flag: "🇱🇸" },
    { code: "lr", name: "LIBERIA", dial: "+231", flag: "🇱🇷" },
    { code: "ly", name: "LIBYA", dial: "+218", flag: "🇱🇾" },
    { code: "li", name: "LIECHTENSTEIN", dial: "+423", flag: "🇱🇮" },
    { code: "lt", name: "LITHUANIA", dial: "+370", flag: "🇱🇹" },
    { code: "lu", name: "LUXEMBOURG", dial: "+352", flag: "🇱🇺" },
    { code: "mo", name: "MACAO", dial: "+853", flag: "🇲🇴" },
    { code: "mg", name: "MADAGASCAR", dial: "+261", flag: "🇲🇬" },
    { code: "mw", name: "MALAWI", dial: "+265", flag: "🇲🇼" },
    { code: "my", name: "MALAYSIA", dial: "+60", flag: "🇲🇾" },
    { code: "mv", name: "MALDIVES", dial: "+960", flag: "🇲🇻" },
    { code: "ml", name: "MALI", dial: "+223", flag: "🇲🇱" },
    { code: "mt", name: "MALTA", dial: "+356", flag: "🇲🇹" },
    { code: "mh", name: "MARSHALL ISLANDS", dial: "+692", flag: "🇲🇭" },
    { code: "mr", name: "MAURITANIA", dial: "+222", flag: "🇲🇷" },
    { code: "mu", name: "MAURITIUS", dial: "+230", flag: "🇲🇺" },
    { code: "mx", name: "MEXICO", dial: "+52", flag: "🇲🇽" },
    { code: "fm", name: "MICRONESIA", dial: "+691", flag: "🇫🇲" },
    { code: "md", name: "MOLDOVA", dial: "+373", flag: "🇲🇩" },
    { code: "mc", name: "MONACO", dial: "+377", flag: "🇲🇨" },
    { code: "mn", name: "MONGOLIA", dial: "+976", flag: "🇲🇳" },
    { code: "me", name: "MONTENEGRO", dial: "+382", flag: "🇲🇪" },
    { code: "ma", name: "MOROCCO", dial: "+212", flag: "🇲🇦" },
    { code: "mz", name: "MOZAMBIQUE", dial: "+258", flag: "🇲🇿" },
    { code: "mm", name: "MYANMAR", dial: "+95", flag: "🇲🇲" },
    { code: "na", name: "NAMIBIA", dial: "+264", flag: "🇳🇦" },
    { code: "nr", name: "NAURU", dial: "+674", flag: "🇳🇷" },
    { code: "np", name: "NEPAL", dial: "+977", flag: "🇳🇵" },
    { code: "nl", name: "NETHERLANDS", dial: "+31", flag: "🇳🇱" },
    { code: "nz", name: "NEW ZEALAND", dial: "+64", flag: "🇳🇿" },
    { code: "ni", name: "NICARAGUA", dial: "+505", flag: "🇳🇮" },
    { code: "ne", name: "NIGER", dial: "+227", flag: "🇳🇪" },
    { code: "ng", name: "NIGERIA", dial: "+234", flag: "🇳🇬" },
    { code: "kp", name: "NORTH KOREA", dial: "+850", flag: "🇰🇵" },
    { code: "mk", name: "NORTH MACEDONIA", dial: "+389", flag: "🇲🇰" },
    { code: "no", name: "NORWAY", dial: "+47", flag: "🇳🇴" },
    { code: "om", name: "OMAN", dial: "+968", flag: "🇴🇲" },
    { code: "pk", name: "PAKISTAN", dial: "+92", flag: "🇵🇰" },
    { code: "pw", name: "PALAU", dial: "+680", flag: "🇵🇼" },
    { code: "ps", name: "PALESTINE", dial: "+970", flag: "🇵🇸" },
    { code: "pa", name: "PANAMA", dial: "+507", flag: "🇵🇦" },
    { code: "pg", name: "PAPUA NEW GUINEA", dial: "+675", flag: "🇵🇬" },
    { code: "py", name: "PARAGUAY", dial: "+595", flag: "🇵🇾" },
    { code: "pe", name: "PERU", dial: "+51", flag: "🇵🇪" },
    { code: "ph", name: "PHILIPPINES", dial: "+63", flag: "🇵🇭" },
    { code: "pl", name: "POLAND", dial: "+48", flag: "🇵🇱" },
    { code: "pt", name: "PORTUGAL", dial: "+351", flag: "🇵🇹" },
    { code: "pr", name: "PUERTO RICO", dial: "+1-787", flag: "🇵🇷" },
    { code: "qa", name: "QATAR", dial: "+974", flag: "🇶🇦" },
    { code: "ro", name: "ROMANIA", dial: "+40", flag: "🇷🇴" },
    { code: "ru", name: "RUSSIA", dial: "+7", flag: "🇷🇺" },
    { code: "rw", name: "RWANDA", dial: "+250", flag: "🇷🇼" },
    { code: "kn", name: "SAINT KITTS AND NEVIS", dial: "+1-869", flag: "🇰🇳" },
    { code: "lc", name: "SAINT LUCIA", dial: "+1-758", flag: "🇱🇨" },
    { code: "vc", name: "SAINT VINCENT", dial: "+1-784", flag: "🇻🇨" },
    { code: "ws", name: "SAMOA", dial: "+685", flag: "🇼🇸" },
    { code: "sm", name: "SAN MARINO", dial: "+378", flag: "🇸🇲" },
    { code: "st", name: "SAO TOME AND PRINCIPE", dial: "+239", flag: "🇸🇹" },
    { code: "sa", name: "SAUDI ARABIA", dial: "+966", flag: "🇸🇦" },
    { code: "sn", name: "SENEGAL", dial: "+221", flag: "🇸🇳" },
    { code: "rs", name: "SERBIA", dial: "+381", flag: "🇷🇸" },
    { code: "sc", name: "SEYCHELLES", dial: "+248", flag: "🇸🇨" },
    { code: "sl", name: "SIERRA LEONE", dial: "+232", flag: "🇸🇱" },
    { code: "sg", name: "SINGAPORE", dial: "+65", flag: "🇸🇬" },
    { code: "sk", name: "SLOVAKIA", dial: "+421", flag: "🇸🇰" },
    { code: "si", name: "SLOVENIA", dial: "+386", flag: "🇸🇮" },
    { code: "sb", name: "SOLOMON ISLANDS", dial: "+677", flag: "🇸🇧" },
    { code: "so", name: "SOMALIA", dial: "+252", flag: "🇸🇴" },
    { code: "za", name: "SOUTH AFRICA", dial: "+27", flag: "🇿🇦" },
    { code: "kr", name: "SOUTH KOREA", dial: "+82", flag: "🇰🇷" },
    { code: "ss", name: "SOUTH SUDAN", dial: "+211", flag: "🇸🇸" },
    { code: "es", name: "SPAIN", dial: "+34", flag: "🇪🇸" },
    { code: "lk", name: "SRI LANKA", dial: "+94", flag: "🇱🇰" },
    { code: "sd", name: "SUDAN", dial: "+249", flag: "🇸🇩" },
    { code: "sr", name: "SURINAME", dial: "+597", flag: "🇸🇷" },
    { code: "se", name: "SWEDEN", dial: "+46", flag: "🇸🇪" },
    { code: "ch", name: "SWITZERLAND", dial: "+41", flag: "🇨🇭" },
    { code: "sy", name: "SYRIA", dial: "+963", flag: "🇸🇾" },
    { code: "tw", name: "TAIWAN", dial: "+886", flag: "🇹🇼" },
    { code: "tj", name: "TAJIKISTAN", dial: "+992", flag: "🇹🇯" },
    { code: "tz", name: "TANZANIA", dial: "+255", flag: "🇹🇿" },
    { code: "th", name: "THAILAND", dial: "+66", flag: "🇹🇭" },
    { code: "tl", name: "TIMOR-LESTE", dial: "+670", flag: "🇹🇱" },
    { code: "tg", name: "TOGO", dial: "+228", flag: "🇹🇬" },
    { code: "to", name: "TONGA", dial: "+676", flag: "🇹🇴" },
    { code: "tt", name: "TRINIDAD AND TOBAGO", dial: "+1-868", flag: "🇹🇹" },
    { code: "tn", name: "TUNISIA", dial: "+216", flag: "🇹🇳" },
    { code: "tr", name: "TURKEY", dial: "+90", flag: "🇹🇷" },
    { code: "tm", name: "TURKMENISTAN", dial: "+993", flag: "🇹🇲" },
    { code: "tv", name: "TUVALU", dial: "+688", flag: "🇹🇻" },
    { code: "ug", name: "UGANDA", dial: "+256", flag: "🇺🇬" },
    { code: "ua", name: "UKRAINE", dial: "+380", flag: "🇺🇦" },
    { code: "ae", name: "UNITED ARAB EMIRATES", dial: "+971", flag: "🇦🇪" },
    { code: "gb", name: "UNITED KINGDOM", dial: "+44", flag: "🇬🇧" },
    { code: "us", name: "UNITED STATES", dial: "+1", flag: "🇺🇸" },
    { code: "uy", name: "URUGUAY", dial: "+598", flag: "🇺🇾" },
    { code: "uz", name: "UZBEKISTAN", dial: "+998", flag: "🇺🇿" },
    { code: "vu", name: "VANUATU", dial: "+678", flag: "🇻🇺" },
    { code: "va", name: "VATICAN CITY", dial: "+379", flag: "🇻🇦" },
    { code: "ve", name: "VENEZUELA", dial: "+58", flag: "🇻🇪" },
    { code: "vn", name: "VIETNAM", dial: "+84", flag: "🇻🇳" },
    { code: "ye", name: "YEMEN", dial: "+967", flag: "🇾🇪" },
    { code: "zm", name: "ZAMBIA", dial: "+260", flag: "🇿🇲" },
    { code: "zw", name: "ZIMBABWE", dial: "+263", flag: "🇿🇼" }
];

async function initRorraxyCountries() {
    const targetEl = document.getElementById('target_country');
    const dialEl = document.getElementById('countryDialCode');
    const profileEl = document.getElementById('countrySelect');

    if (targetEl) {
        targetEl.innerHTML = WORLD_COUNTRIES.map(c =>
            `<option value="${c.code}">${c.flag} ${c.name}</option>`
        ).join('');
    }

    if (dialEl) {
        dialEl.innerHTML = WORLD_COUNTRIES.map(c =>
            `<option value="${c.dial}">${c.flag} ${c.dial}</option>`
        ).join('');
    }

    if (profileEl) {
        profileEl.innerHTML = WORLD_COUNTRIES.map(c => {
            const titleName = c.name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            return `<option value="${titleName}">${c.flag} ${titleName}</option>`;
        }).join('');
    }

    let detectedCode = 'bd';
    try {
        const res = await fetch('https://ipapi.co/json/').catch(() => null);
        if (res && res.ok) {
            const data = await res.json();
            if (data && data.country_code) {
                detectedCode = data.country_code.toLowerCase();
            }
        }
    } catch (e) {}

    const matched = WORLD_COUNTRIES.find(c => c.code === detectedCode) || WORLD_COUNTRIES.find(c => c.code === 'bd');

    if (matched) {
        if (targetEl) targetEl.value = matched.code;
        if (dialEl) dialEl.value = matched.dial;
        if (profileEl) {
            profileEl.value = matched.name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        }
    }
}

document.addEventListener('DOMContentLoaded', initRorraxyCountries);
