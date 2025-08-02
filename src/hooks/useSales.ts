import { useState, useEffect } from 'react';
import { Sale } from '../types/Sale';
import { storageService } from '../services/storageService';

const useSales = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [totalSales, setTotalSales] = useState<number>(0);

    useEffect(() => {
        const loadSales = async () => {
            const storedSales = await storageService.getSales();
            setSales(storedSales);
            calculateTotalSales(storedSales);
        };

        loadSales();
    }, []);

    const calculateTotalSales = (salesData: Sale[]) => {
        const total = salesData.reduce((acc, sale) => acc + sale.amount, 0);
        setTotalSales(total);
    };

    const addSale = (newSale: Sale) => {
        const updatedSales = [...sales, newSale];
        setSales(updatedSales);
        calculateTotalSales(updatedSales);
        storageService.saveSales(updatedSales);
    };

    const resetSales = () => {
        setSales([]);
        setTotalSales(0);
        storageService.clearSales();
    };

    return {
        sales,
        totalSales,
        addSale,
        resetSales,
    };
};

export default useSales;