'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getRole } from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const role = getRole();
    if (token && role) {
      router.replace(role === 'DOCTOR' ? '/doctor' : '/patient');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading MedLog...</p>
    </div>
  );
}
