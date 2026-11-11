import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Разбор обрыва новичков",
  description: "Первые 90 дней: на каком шаге маршрута обрываются новички",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-[#efeae2] font-sans text-stone-950 antialiased">{children}</body>
    </html>
  );
}
