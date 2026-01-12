import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { Providers } from "./providers";
import { config } from "@/lib/web3-config";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MNEE Gatekeeper",
  description: "Subscribe to premium Telegram channels with MNEE stablecoin",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const cookies = headersList.get("cookie");
  const initialState = cookieToInitialState(config, cookies);

  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gray-950`}>
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
