import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { APP_LOGO_SRC } from "@/shared/brand/logo";
import { AppProviders } from "./providers/AppProviders";
import { themeInitScript } from "@/core/theme/ThemeProvider";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "UpJunoo Pro",
  description: "Back-office UpJunoo — Admin, Partenaire, Franchise",
  icons: {
    icon: APP_LOGO_SRC,
    apple: APP_LOGO_SRC,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${poppins.variable} font-sans`}
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
