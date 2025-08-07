import type { Invoice } from '../services/syncService';

// Génération de factures de test pour chaque vendeuse
export const generateTestInvoices = (): Invoice[] => {
  const vendors = [
    'Billy',
    'Sylvie',
    'Lucia',
    'Johan',
    'Sabrina',
    'Babette',
    'Cathy'
  ];

  const clients = [
    { name: 'Marie Dupont', email: 'marie.dupont@email.com', phone: '01 23 45 67 89' },
    { name: 'Jean Martin', email: 'jean.martin@email.com', phone: '06 12 34 56 78' },
    { name: 'Sophie Dubois', email: 'sophie.dubois@email.com', phone: '07 98 76 54 32' },
    { name: 'Pierre Lambert', email: 'pierre.lambert@email.com', phone: '01 87 65 43 21' },
    { name: 'Lucie Bernard', email: 'lucie.bernard@email.com', phone: '06 45 67 89 01' },
    { name: 'Antoine Moreau', email: 'antoine.moreau@email.com', phone: '07 23 45 67 89' },
    { name: 'Camille Roux', email: 'camille.roux@email.com', phone: '01 34 56 78 90' }
  ];

  const products = [
    { name: 'MATELAS BAMBOU 140 x 190', price: 1800, quantity: 1 },
    { name: 'SURMATELAS BAMBOU 140 x 190', price: 440, quantity: 1 },
    { name: 'Oreiller Douceur', price: 80, quantity: 2 },
    { name: 'Couette 220x240', price: 300, quantity: 1 },
    { name: 'PLATEAU PRESTIGE 140 x 190', price: 180, quantity: 1 }
  ];

  const statuses: Invoice['status'][] = ['draft', 'sent', 'partial', 'paid'];
  const itemStatuses = ['pending', 'available', 'delivered', 'cancelled'];
  const paymentMethods = ['cash', 'card', 'check', 'transfer', 'multi'] as const;

  return vendors.map((vendor, index) => {
    const client = clients[index];
    const status = statuses[index % statuses.length];
    const selectedProducts = products.slice(0, Math.floor(Math.random() * 3) + 1);
    
    const total = selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours à partir d'aujourd'hui
    const paymentMethod = paymentMethods[index % paymentMethods.length];
    
    return {
      id: `test-invoice-${index + 1}`,
      number: `F-${String(index + 1).padStart(4, '0')}`,
      vendorName: vendor,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      status: status,
      items: selectedProducts.map((product, productIndex) => ({
        id: `item-${index}-${productIndex}`,
        productName: product.name,
        category: 'Literie',
        quantity: product.quantity,
        unitPrice: product.price,
        totalPrice: product.price * product.quantity,
        status: itemStatuses[productIndex % itemStatuses.length] as 'pending' | 'available' | 'delivered' | 'cancelled'
      })),
      totalHT: Math.round(total / 1.2 * 100) / 100,
      totalTTC: total,
      dueDate: dueDate,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Dans les 7 derniers jours
      updatedAt: new Date(),
      notes: `Facture de test pour ${vendor} - Statut: ${status}`,
      paymentDetails: {
        method: paymentMethod,
        status: status === 'paid' ? 'completed' : status === 'partial' ? 'partial' : 'pending',
        totalAmount: total,
        paidAmount: status === 'paid' ? total : status === 'partial' ? Math.round(total * 0.5) : 0,
        remainingAmount: status === 'paid' ? 0 : status === 'partial' ? Math.round(total * 0.5) : total
      }
    };
  });
};

// Fonction pour ajouter les factures de test au stockage local
export const addTestInvoicesToStorage = () => {
  const testInvoices = generateTestInvoices();
  localStorage.setItem('test-invoices', JSON.stringify(testInvoices));
  return testInvoices;
};
