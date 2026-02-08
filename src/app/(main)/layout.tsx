'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Header from '@/components/layout/Header';
import { useProfile } from '@/providers/ProfileProvider';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isNewUser, isLoading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isNewUser) {
      router.replace('/welcome');
    }
  }, [isLoading, isNewUser, router]);

  // Show spinner while profile is being resolved
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Prevent flash of main UI while redirecting
  if (isNewUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="flex flex-1 flex-col md:ml-16">
        <Header />

        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
