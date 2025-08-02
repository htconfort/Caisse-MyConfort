import { useEffect } from 'react';

const STORAGE_KEY = 'ipadCaisseAppData';

export const saveToLocalStorage = (data: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getFromLocalStorage = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
};

export const clearLocalStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const useLocalStorage = () => {
    useEffect(() => {
        const data = getFromLocalStorage();
        if (data) {
            // Handle the retrieved data as needed
        }
    }, []);
};