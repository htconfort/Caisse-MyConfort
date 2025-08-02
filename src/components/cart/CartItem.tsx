import React from 'react';
import { CartItemProps } from '../../types/Cart';

const CartItem: React.FC<CartItemProps> = ({ item, onRemove, onQuantityChange }) => {
    const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newQuantity = parseInt(event.target.value);
        onQuantityChange(item.id, newQuantity);
    };

    return (
        <div className="cart-item">
            <span className="item-name">{item.name}</span>
            <span className="item-price">{item.price.toFixed(2)} €</span>
            <input
                type="number"
                value={item.quantity}
                onChange={handleQuantityChange}
                min="1"
                className="item-quantity"
            />
            <button onClick={() => onRemove(item.id)} className="remove-button">Remove</button>
        </div>
    );
};

export default CartItem;