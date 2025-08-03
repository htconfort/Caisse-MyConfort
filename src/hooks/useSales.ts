import { useState, useEffect } from 'react';
import { Sale } from '../types/Sale';
import { saveToLocalStorage, getFromLocalStorage } from '../services/storageService';

const useSales = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [totalSales, setTotalSales] = useState<number>(0);

    useEffect(() => {
        const loadSales = () => {
            const storedData = getFromLocalStorage();
            const storedSales = storedData?.sales || [];
            setSales(storedSales);
            
            // Calculer le total
            const total = storedSales.reduce((acc: number, sale: Sale) => acc + sale.totalAmount, 0);
            setTotalSales(total);
        };

        loadSales();
    }, []);

    const addSale = (newSale: Sale) => {
        const updatedSales = [...sales, newSale];
        setSales(updatedSales);
        
        const newTotal = updatedSales.reduce((acc, sale) => acc + sale.totalAmount, 0);
        setTotalSales(newTotal);
        
        // Sauvegarder dans le localStorage
        const existingData = getFromLocalStorage() || {};
        saveToLocalStorage({ ...existingData, sales: updatedSales });
    };

    const resetSales = () => {
        setSales([]);
        setTotalSales(0);
        
        // Nettoyer le localStorage
        const existingData = getFromLocalStorage() || {};
        saveToLocalStorage({ ...existingData, sales: [] });
    };

    return {
        sales,
        totalSales,
        addSale,
        resetSales
    };
};

export default useSales;