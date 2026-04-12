import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ObraYa - Plataforma de Construcción",
  description: "Gestión integral de proyectos de construcción",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
