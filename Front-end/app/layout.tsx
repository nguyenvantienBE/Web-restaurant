import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "The Albion by Kirk | Modern European Restaurant · Saigon",
  description:
    "Perched on the 23rd floor of Hôtel des Arts Saigon, The Albion by Kirk Westaway offers sweeping views and modern European cuisine anchored in British heritage.",
  keywords: ["restaurant", "Saigon", "European cuisine", "fine dining", "Ho Chi Minh City", "Kirk Westaway"],
  openGraph: {
    title: "The Albion by Kirk | Modern European Restaurant",
    description: "Elevated European dining on the 23rd floor of Hôtel des Arts Saigon.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
