export const calculateTotal = (cartItems) => {
    return cartItems.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);
};

export const calculateDiscountedTotal = (total, discount) => {
    return total - (total * (discount / 100));
};

export const calculateTax = (total, taxRate) => {
    return total * (taxRate / 100);
};

export const calculateFinalAmount = (total, discount, taxRate) => {
    const discountedTotal = calculateDiscountedTotal(total, discount);
    const taxAmount = calculateTax(discountedTotal, taxRate);
    return discountedTotal + taxAmount;
};