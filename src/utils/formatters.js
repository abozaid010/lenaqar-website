export const formatPrice = (num) => {
    if (num === '' || num === null || num === undefined) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
