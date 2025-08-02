import { Sale } from '../types/Sale';

export const exportToCSV = (sales: Sale[], filename: string): void => {
    const csvContent = [
        ['Date', 'Vendor', 'Total', 'Payment Method'], // Header
        ...sales.map(sale => [
            sale.date,
            sale.vendor,
            sale.total,
            sale.paymentMethod
        ])
    ]
    .map(e => e.join(","))
    .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportToPDF = (sales: Sale[], filename: string): void => {
    const doc = new jsPDF();
    doc.text("Sales Report", 20, 20);
    const headers = ["Date", "Vendor", "Total", "Payment Method"];
    const data = sales.map(sale => [sale.date, sale.vendor, sale.total, sale.paymentMethod]);

    doc.autoTable({
        head: [headers],
        body: data,
    });

    doc.save(filename);
};