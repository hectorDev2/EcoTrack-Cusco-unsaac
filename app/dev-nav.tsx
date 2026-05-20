const links = [
  { href: "/", label: "🏠 Inicio" },
  { href: "/inicio", label: "🧑 Inicio Ciudadano" },
  { href: "/reportar", label: "📸 Reportar" },
  { href: "/mapa", label: "🗺️ Mapa" },
  { href: "/dashboard", label: "📊 Dashboard" },
  { href: "/admin-incidencias", label: "⚠️ Incidencias Admin" },
  { href: "/incidencias", label: "⚠️ Incidencias" },
  { href: "/flota", label: "🚛 Flota" },
  { href: "/analisis", label: "📈 Análisis" },
  { href: "/usuarios", label: "👥 Usuarios" },
  { href: "/configuracion", label: "⚙️ Config" },
  { href: "/admin-rutas", label: "🛣️ Rutas" },
  { href: "/conductor/dashboard", label: "🚛 Conductor" },
  { href: "/conductor/ruta", label: "📍 Paradas" },
  { href: "/residuos", label: "♻️ Residuos" },
  { href: "/admin-residuos", label: "♻️ Residuos Admin" },
];

export function DevNav() {
  return (
    <details className="group fixed top-2 left-1/2 -translate-x-1/2 z-[9999]">
      <summary className="cursor-pointer select-none list-none px-3 py-1 bg-zinc-900/80 text-white text-[11px] font-mono rounded-full shadow-lg backdrop-blur hover:bg-zinc-800 transition-colors mx-auto w-fit">
        <span className="group-open:hidden">☰ DEV NAV</span>
        <span className="hidden group-open:inline">✕ DEV NAV</span>
      </summary>
      <nav className="mt-2 bg-zinc-900/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 p-3 flex flex-wrap gap-1.5 max-w-[90vw] justify-center">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="px-2.5 py-1 text-[12px] font-mono text-zinc-300 hover:text-white hover:bg-zinc-700/60 rounded-lg transition-colors whitespace-nowrap"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </details>
  );
}
