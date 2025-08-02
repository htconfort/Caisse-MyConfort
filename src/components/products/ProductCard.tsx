import React from 'react';
import { Product } from '../../types/Product';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className="product-card">
      <h3 className="product-name">{product.name}</h3>
      <p className="product-price">{product.price.toFixed(2)} €</p>
      <button className="add-to-cart-button" onClick={() => onAddToCart(product)}>
        Ajouter au panier
      </button>
    </div>
  );
};

export default ProductCard;