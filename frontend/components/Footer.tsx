// frontend/components/Footer.tsx
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-gray-600 flex items-center justify-center gap-2">
        <span>Copyright ©</span>
        <Image
          src="/assets/quirk.png"
          alt="Quirk logo"
          width={60}
          height={18}
          style={{ objectFit: "contain", height: "18px", width: "auto" }}
          priority
        />
        <span>Quirk Trade Tool - powered by</span>
        <span className="font-semibold text-[#00d9a3]">Quirk AI</span>
      </div>
    </footer>
  );
}
