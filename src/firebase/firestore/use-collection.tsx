'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  onSnapshot,
  query,
  collection,
  type Firestore,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useCollection<T = DocumentData>(pathOrQuery: string | null | Query) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const q = useMemo(() => {
    if (!firestore || !pathOrQuery) {
      return null;
    }
    if (typeof pathOrQuery === 'string') {
      return query(collection(firestore as Firestore, pathOrQuery));
    }
    return pathOrQuery;
  }, [firestore, pathOrQuery]);


  useEffect(() => {
    if (!q) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as unknown as T)
        );
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q]);

  return { data, loading, error };
}
