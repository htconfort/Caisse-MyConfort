import { PrintOptions } from '../types/PrintOptions';

const printService = {
    printReceipt: (receiptData: any, options: PrintOptions) => {
        const { title, items, total } = receiptData;

        const receiptContent = `
            <h1>${title}</h1>
            <ul>
                ${items.map(item => `<li>${item.name}: ${item.price}</li>`).join('')}
            </ul>
            <h2>Total: ${total}</h2>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        h1, h2 { text-align: center; }
                        ul { list-style-type: none; padding: 0; }
                    </style>
                </head>
                <body>
                    ${receiptContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
};

export default printService;