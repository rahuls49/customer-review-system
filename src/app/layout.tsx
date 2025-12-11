import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReviewTrack - Customer Feedback Management",
  description: "Multi-Store Customer Feedback & Task Management System. Turn negative reviews into positive actions.",
  keywords: ["customer feedback", "task management", "retail", "SLA tracking"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
