import { redirect } from 'next/navigation';

// La raíz redirige al dashboard (o al login si no hay sesión, manejado por middleware)
export default function Home() {
  redirect('/dashboard');
}
