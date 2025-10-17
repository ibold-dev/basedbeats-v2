import "./globals.css";
import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import { headers } from "next/headers";
import { type ReactNode } from "react";
import { cookieToInitialState } from "wagmi";
import { Toaster } from "sonner";

import { getConfig } from "../wagmi";
import { Providers } from "./providers";

const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Based Beats",
  description: "Based Beats is a platform for creating and sharing beats.",
  icons: {
    icon: "/logo.svg",
  },
  manifest: "/manifest.ts",
  appleWebApp: { title: "Based Beats", statusBarStyle: "black-translucent" },
};

export default function RootLayout(props: { children: ReactNode }) {
  const initialState = cookieToInitialState(
    getConfig(),
    headers().get("cookie")
  );
  return (
    <html lang="en">
      <body className={josefinSans.className}>
        <Providers initialState={initialState}>{props.children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
