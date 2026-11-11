import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Разбор обрыва новичков",
  description: "Первые 90 дней: на каком шаге маршрута обрываются новички",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
