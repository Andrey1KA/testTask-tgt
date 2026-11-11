import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Разбор обрыва новичков",
  description: "Первые 90 дней: на каком шаге маршрута обрываются новички",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-stone-100 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
