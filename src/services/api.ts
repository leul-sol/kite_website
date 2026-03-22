// Mock API Service for Kite Business Owner Portal

export const mockApi = {
  getListings: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return [
      { id: '1', name: 'Royal Velvet Sofa', category: 'Furniture', price: 120, status: 'Active', stock: 5, image: '🛋️' },
      { id: '2', name: 'Golden Candelabra', category: 'Decor', price: 45, status: 'Active', stock: 12, image: '🕯️' },
      { id: '3', name: 'Crystal Chandelier', category: 'Lighting', price: 350, status: 'Low Stock', stock: 2, image: '💡' },
      { id: '4', name: 'Marble Banquet Table', category: 'Furniture', price: 200, status: 'Inactive', stock: 0, image: '🍽️' },
    ];
  },
  
  getOrders: async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return [
      { id: 'ORD-7721', item: 'Royal Velvet Sofa', customer: 'Alex Rivera', date: 'Oct 24 - 26', total: '$360', status: 'new' },
      { id: 'ORD-7725', item: 'Golden Candelabra (x4)', customer: 'Sophie Chen', date: 'Oct 25', total: '$180', status: 'new' },
    ];
  },

  getAnalytics: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      earnings: '$12,840.00',
      activeBookings: 24,
      pendingRequests: 8,
      profileVisits: 1420
    };
  }
};
