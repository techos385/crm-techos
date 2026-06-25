'use client'

// src/components/Providers.tsx
// Proveedores globales: sesiÃ³n, tema, toasts

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/Toaster'
import { OnboardingProvider } from '@/components/OnboardingProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OnboardingProvider>
        {children}
        <Toaster />
      </OnboardingProvider>
    </SessionProvider>
  )
}
