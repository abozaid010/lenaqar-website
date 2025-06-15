export const formatPrice = (num) => {
    if (num === '' || num === null || num === undefined) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const convertArabicToEnglishNumbers = (input) => {
    if (typeof input !== "string") return input;
    const arabicToEnglish = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    return input.replace(/[٠-٩]/g, d => arabicToEnglish[d]);
};