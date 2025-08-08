export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount || 0);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

export const formatTime = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const formatDateShort = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date));
};

export const formatTimeShort = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const getDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }
  
  return `${formatDateShort(start)} - ${formatDateShort(end)}`;
};

export const getTodayDate = () => {
  return new Date().toLocaleDateString('fr-FR');
};

export const getTodayDateTime = () => {
  return new Date().toLocaleString('fr-FR');
};

export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  
  return today.toDateString() === checkDate.toDateString();
};

export const isThisWeek = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  
  return checkDate >= startOfWeek && checkDate <= endOfWeek;
};

export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi comme premier jour
  return new Date(d.setDate(diff));
};

export const getWeekEnd = (date = new Date()) => {
  const start = getWeekStart(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
};

export const getMonthStart = (date = new Date()) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

export const getMonthEnd = (date = new Date()) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const subtractDays = (date, days) => {
  return addDays(date, -days);
};

export const getDaysDifference = (date1, date2) => {
  const timeDiff = Math.abs(new Date(date2) - new Date(date1));
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

export const getTimeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) {
    return 'À l\'instant';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;
  }
  
  return formatDateShort(past);
};

export const createFilename = (prefix, date = new Date(), extension = 'pdf') => {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `${prefix}-${dateStr}-${timeStr}.${extension}`;
};

export const generateReportFilename = (type, date = new Date()) => {
  const dateStr = formatDateShort(date).replace(/\//g, '-');
  return `rapport-${type}-${dateStr}.pdf`;
};

export const parseTime = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

export const validateTime = (timeString) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

export const formatTimeRange = (startTime, endTime) => {
  return `${startTime} - ${endTime}`;
};

export const getCurrentWeekData = (sales) => {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  
  return sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= weekStart && saleDate <= weekEnd;
  });
};

export const getCurrentMonthData = (sales) => {
  const monthStart = getMonthStart();
  const monthEnd = getMonthEnd();
  
  return sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= monthStart && saleDate <= monthEnd;
  });
};

export const getTodayData = (sales) => {
  return sales.filter(sale => isToday(sale.date));
};

export const groupSalesByDate = (sales) => {
  return sales.reduce((groups, sale) => {
    const date = formatDateShort(sale.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(sale);
    return groups;
  }, {});
};

export const groupSalesByVendor = (sales) => {
  return sales.reduce((groups, sale) => {
    const vendorName = sale.vendorName || 'Inconnu';
    if (!groups[vendorName]) {
      groups[vendorName] = [];
    }
    groups[vendorName].push(sale);
    return groups;
  }, {});
};

export const calculateDailySummary = (sales) => {
  const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const salesCount = sales.length;
  const averageBasket = salesCount > 0 ? totalSales / salesCount : 0;
  
  const paymentMethods = sales.reduce((methods, sale) => {
    const method = sale.paymentMethod || 'Inconnu';
    methods[method] = (methods[method] || 0) + (sale.totalAmount || 0);
    return methods;
  }, {});
  
  const vendors = groupSalesByVendor(sales);
  const vendorStats = Object.entries(vendors).map(([name, vendorSales]) => ({
    name,
    sales: vendorSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
    count: vendorSales.length,
    percentage: totalSales > 0 ? (vendorSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) / totalSales * 100) : 0
  }));
  
  return {
    totalSales,
    salesCount,
    averageBasket,
    paymentMethods,
    vendorStats,
    date: getTodayDate()
  };
};
