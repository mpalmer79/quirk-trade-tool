import { DEALERSHIPS } from "@/app/dealerships";

// Generate static params for all dealerships at build time
export async function generateStaticParams() {
  return DEALERSHIPS.map((dealership) => {
    const slug = dealership.name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^\w]/g, "");
    return { slug };
  });
}

export default function DealershipAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
