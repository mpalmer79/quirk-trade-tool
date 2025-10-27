export const metadata = {
  title: "Quirk Trade Tool",
  description: "Multi-Source Vehicle Valuation (Demo)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
