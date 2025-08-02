import React, { useState, useEffect } from 'react';
import { Category } from '../../types/Product';
import categoriesData from '../../data/categories.json';

const CategorySelector: React.FC<{ onSelect: (category: Category) => void }> = ({ onSelect }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    useEffect(() => {
        setCategories(categoriesData);
    }, []);

    const handleCategoryChange = (category: Category) => {
        setSelectedCategory(category);
        onSelect(category);
    };

    return (
        <div className="category-selector">
            <h2>Sélectionnez une catégorie</h2>
            <ul>
                {categories.map((category) => (
                    <li key={category.id} onClick={() => handleCategoryChange(category)} className={selectedCategory?.id === category.id ? 'active' : ''}>
                        {category.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CategorySelector;