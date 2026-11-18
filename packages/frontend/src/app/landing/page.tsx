'use client';

import { useQuery } from '@tanstack/react-query';
import { UnicornLanding } from '@/components/landing/UnicornLanding';
import { getPublicCompanies } from '@/lib/marketplace';

// Se sirve en "/" del dominio apex (obraya.com.ar), via rewrite del
// middleware segun el Host header -- ver middleware.ts. app.obraya.com.ar
// sigue mostrando la app directo en "/" (page.tsx), sin esta landing.
export default function LandingPage() {
  const { data: companies } = useQuery({
    queryKey: ['public-companies'],
    queryFn: getPublicCompanies,
  });

  return <UnicornLanding companiesCount={companies?.length} />;
}
