import Link from "next/link";

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-on-background pb-32 font-sans">
      {children}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-container-margin pb-md pt-sm bg-surface-container border-t border-outline-variant/30 shadow-[0_-4px_12px_rgba(45,90,39,0.08)] rounded-t-xl">
        <Link
          className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-4 py-1 active:scale-90 transition-all duration-150"
          href="/inicio"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            home
          </span>
          <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
            Inicio
          </span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-primary-container/20 transition-colors active:scale-90 transition-all duration-150"
          href="/mapa"
        >
          <span className="material-symbols-outlined">distance</span>
          <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
            Mapa
          </span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-primary-container/20 transition-colors active:scale-90 transition-all duration-150"
          href="/reportar"
        >
          <span className="material-symbols-outlined">report_problem</span>
          <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
            Reportar
          </span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-primary-container/20 transition-colors active:scale-90 transition-all duration-150"
          href="#"
        >
          <span className="material-symbols-outlined">person</span>
          <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
            Perfil
          </span>
        </Link>
      </nav>
    </div>
  );
}
