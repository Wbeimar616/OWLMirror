'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  onSnapshot,
  doc,
  type Firestore,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useDoc<T = DocumentData>(pathOrRef: string | null | DocumentReference) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const docRef = useMemo(() => {
     if (!firestore || !pathOrRef) {
      return null;
    }
    if (typeof pathOrRef === 'string') {
      return doc(firestore as Firestore, pathOrRef)
    }
    return pathOrRef;
  }, [firestore, pathOrRef]);

  useEffect(() => {
    if (!docRef) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as unknown as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return { data, loading, error };
}
