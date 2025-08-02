import React from 'react';
import { useCart } from '../../hooks/useCart';
import { Button } from '../common/Button';

const CartActions: React.FC = () => {
    const { clearCart, finalizeSale } = useCart();

    const handleClearCart = () => {
        clearCart();
    };

    const handleFinalizeSale = () => {
        finalizeSale();
    };

    return (
        <div className="cart-actions">
            <Button onClick={handleClearCart} label="Annuler le panier" />
            <Button onClick={handleFinalizeSale} label="Finaliser la vente" />
        </div>
    );
};

export default CartActions;