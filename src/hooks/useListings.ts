import { useState, useEffect } from 'react';
import { mockApi } from '@/services/api';

export function useListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.getListings().then(data => {
      setListings(data);
      setLoading(false);
    });
  }, []);

  return { listings, loading };
}
