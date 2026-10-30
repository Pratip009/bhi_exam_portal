import "./globals.css";

export const metadata = {
  title: "Bright Horizon Institute — Exam Portal",
  description: "Online MCQ examinations for Bright Horizon Institute",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
