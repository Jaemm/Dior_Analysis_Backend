export class LanaguageToCountryService {
    lanaguageToCountry(languageCode: string) {
        const languageObj: any = {
            'EN': 'US', // English - United States
            'ES': 'ES', // Spanish - Spain
            'FR': 'FR', // French - France
            'DE': 'DE', // German - Germany
            'IT': 'IT', // Italian - Italy
            'JA': 'JP', // Japanese - Japan
            'KR': 'KR', // Korean - South Korea
            'KO': 'KR', // Korean - South Korea
            'CN': 'CN', // Chinese - China
            'zh-Hans': 'CN', // Chinese - China

            'RU': 'RU', // Russian - Russia
            'SA': 'SA', // Arabic - Saudi Arabia
            // 'AR': 'AR', // Argentina
            'AU': 'AU', // Australia
            'AT': 'AT', // Austria
            'BH': 'BH', // Bahrain
            'BE': 'BE', // Belgium
            'BR': 'BR', // Brazil
            'CA': 'CA', // Canada
            'CL': 'CL', // Chile
            'CO': 'CO', // Colombia
            'CY': 'CY', // Cyprus
            'CZ': 'CZ', // Czech Republic
            'DK': 'DK', // Denmark
            'EC': 'EC', // Ecuador
            'EG': 'EG', // Egypt
            'SV': 'SV', // El Salvador
            'EX': 'ES', // Spain (duplicate entry for demonstration purposes)
            'FI': 'FI', // Finland
            'GR': 'GR', // Greece
            'GT': 'GT', // Guatemala
            'HK': 'HK', // Hong Kong
            'HU': 'HU', // Hungary
            'IN': 'IN', // India
            'IO': 'ID', // Indonesia (Note: IO is not a valid ISO country code, using ID for Indonesia)
            'JP': 'JP', // Japan
            'JO': 'JO', // Jordan
            'KW': 'KW', // Kuwait
            'LU': 'LU', // Luxembourg
            'MO': 'MO', // Macau
            'MY': 'MY', // Malaysia
            'MX': 'MX', // Mexico
            'US': 'US', // United States
            'MA': 'MA', // Morocco
            'NL': 'NL', // Netherlands
            'NO': 'NO', // Norway
            'OM': 'OM', // Oman
            'PA': 'PA', // Panama
            'PY': 'PY', // Paraguay
            'PE': 'PE', // Peru
            'PH': 'PH', // Philippines
            'PL': 'PL', // Poland
            'PT': 'PT', // Portugal
            'PR': 'PR', // Puerto Rico
            'QA': 'QA', // Qatar
            'RO': 'RO', // Romania
            'SG': 'SG', // Singapore
            'ZA': 'ZA', // South Africa
            'SE': 'SE', // Sweden
            'CH': 'CH', // Switzerland
            'zh-Hans-TW': 'TW', // Taiwan
            'TH': 'TH', // Thailand
            'TR': 'TR', // Turkey
            'AR': 'AE', // United Arab Emirates
            'GB': 'GB', // United Kingdom
            'UY': 'UY', // Uruguay
            'VN': 'VN', // Vietnam
            'Vi': 'VN', // Vietnam
            'WW': 'WW', // Worldwide
        };

        return languageObj[languageCode] || null;
    }
}

