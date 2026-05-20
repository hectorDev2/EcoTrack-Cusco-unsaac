import Link from "next/link";
import { AdminShell } from "./admin-shell";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Panel" },
  { href: "/admin-incidencias", icon: "report_problem", label: "Incidencias" },
  { href: "/flota", icon: "local_shipping", label: "Flota" },
  { href: "/analisis", icon: "bar_chart", label: "Analíticas" },
  { href: "/usuarios", icon: "group", label: "Usuarios" },
  { href: "/configuracion", icon: "settings", label: "Configuración" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell>
      <div className="bg-background text-on-surface min-h-screen flex">
        <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col p-4 border-r border-outline-variant bg-surface-container shadow-sm shadow-primary/10 z-50">
          <div className="mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-sm">
                  recycling
                </span>
              </div>
              <div>
                <h1 className="text-[24px] leading-[32px] font-bold font-headline-lg font-extrabold text-primary">
                  Eco Track Cusco
                </h1>
                <p className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-on-surface-variant/70 uppercase">
                  Cusco Waste Management
                </p>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className="flex items-center gap-4 py-3 px-4 text-on-surface-variant hover:bg-surface-variant/50 transition-colors rounded-lg"
                href={item.href}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-[16px] leading-[24px]">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-2 border-t border-outline-variant pt-4">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant">
                Apariencia
              </span>
              <ThemeToggle />
            </div>
            <LogoutButton />
          </div>
        </aside>

        <main className="ml-64 min-h-screen w-[calc(100%-16rem)]">
          {children}
        </main>
      </div>
    </AdminShell>
  );
}
