import { Sora, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata = {
  title: {
    default: "Athma Mind Care Hospital",
    template: "%s | Athma Mind Care",
  },
  description: "Patient care, from registration to doctor consultation. Book assessments, track your progress, and stay connected with your care team.",
  keywords: ["mental health", "mind care", "therapy", "assessment", "counseling", "wellness"],
  authors: [{ name: "Athma Mind Care" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "Athma Mind Care Hospital",
    description: "Patient care, from registration to doctor consultation.",
    type: "website",
    locale: "en_IN",
    siteName: "Athma Mind Care",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${inter.variable} antialiased`}>
        {children}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#1E2A47",
              fontSize: "13px",
              borderRadius: "12px",
              padding: "12px 16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid #E2E8F0",
            },
            success: {
              iconTheme: {
                primary: "#1F6D48",
                secondary: "#fff",
              },
              style: {
                border: "1px solid #BBF7D0",
                background: "#F0FDF4",
              },
            },
            error: {
              iconTheme: {
                primary: "#DC2626",
                secondary: "#fff",
              },
              style: {
                border: "1px solid #FECACA",
                background: "#FEF2F2",
              },
            },
          }}
        />
      </body>
    </html>
  );
}