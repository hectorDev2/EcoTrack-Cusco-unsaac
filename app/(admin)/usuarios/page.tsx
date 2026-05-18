const users = [
  { initials: "AM", name: "Alejandro Mamani", email: "a.mamani@cusco.gob.pe", role: "Admin", roleStyle: "bg-primary-container/20 text-primary", zone: "Cusco Centro", active: true },
  { initials: "LC", name: "Luciana Condori", email: "luciana.c@gmail.com", role: "Citizen", roleStyle: "bg-surface-container-highest text-on-surface-variant", zone: "San Blas", active: true },
  { initials: "RP", name: "Roberto Paucar", email: "r.paucar@transportes.com", role: "Driver", roleStyle: "bg-secondary-container/30 text-secondary", zone: "Santa Ana", active: false },
  { initials: "SQ", name: "Sofia Quispe", email: "s.quispe@llaqtalimpia.pe", role: "Collector", roleStyle: "bg-primary-container/10 text-primary", zone: "Lucre", active: true },
];

const stats = [
  { label: "Total Usuarios", value: "1,284", icon: "group", color: "bg-primary-container/20 text-primary" },
  { label: "Activos", value: "1,150", icon: "check_circle", color: "bg-waste-organic/20 text-waste-organic" },
  { label: "Conductores", value: "42", icon: "local_shipping", color: "bg-secondary-container/20 text-secondary" },
  { label: "Incidencias", value: "12", icon: "report", color: "bg-status-alert/20 text-status-alert" },
];

export default function UsuariosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="bg-surface border-b border-outline-variant shadow-sm flex justify-between items-center w-full px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-6 flex-1">
          <h2 className="text-[24px] leading-[32px] font-extrabold text-primary">
            Terra Civic Admin
          </h2>
          <div className="max-w-md w-full relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-md text-[14px] leading-[20px] focus:ring-2 focus:ring-primary"
              placeholder="Buscar usuarios, roles o zonas..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">help</span>
          </button>
          <div className="h-8 w-[1px] bg-outline-variant mx-2" />
          <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-container-low p-1 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full border-2 border-primary-fixed bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              <span className="material-symbols-outlined text-sm">person</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">Admin Cusco</span>
          </div>
        </div>
      </header>

      <div className="p-6 overflow-auto flex-1">
        <div className="max-w-[1440px] mx-auto space-y-lg">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-primary">
                Gestión de Usuarios
              </h3>
              <p className="text-on-surface-variant text-[16px] leading-[24px] mt-1">
                Administra los permisos y zonas de acceso para ciudadanos y personal municipal.
              </p>
            </div>
            <button className="bg-primary text-on-primary px-6 py-4 rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-bold flex items-center gap-2 hover:shadow-md transition-shadow">
              <span className="material-symbols-outlined">person_add</span>
              Agregar Usuario
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-surface-card p-4 rounded-xl shadow-sm border border-outline-variant flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                  <span className="material-symbols-outlined">{stat.icon}</span>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[12px] leading-[16px] tracking-[0.05em] font-bold uppercase">
                    {stat.label}
                  </p>
                  <p className="text-[24px] leading-[32px] font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-6">
            <div className="flex-1 bg-surface-card rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Nombre</th>
                      <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Email</th>
                      <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Rol</th>
                      <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Zona</th>
                      <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Estado</th>
                      <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {users.map((user) => (
                      <tr
                        key={user.email}
                        className="hover:bg-surface-container transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {user.initials}
                            </div>
                            <span className="text-[16px] leading-[24px] font-bold">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant text-[14px] leading-[20px]">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-sm py-xs rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-bold ${user.roleStyle}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[14px] leading-[20px] text-on-surface-variant">
                          {user.zone}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-1 ${user.active ? "text-waste-organic" : "text-waste-non-recyclable"}`}>
                            <span className={`w-2 h-2 rounded-full ${user.active ? "bg-waste-organic" : "bg-waste-non-recyclable"}`} />
                            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">{user.active ? "Activo" : "Inactivo"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button className="p-1 text-outline hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className="p-1 text-outline hover:text-error transition-colors">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-t border-outline-variant">
                <span className="text-[14px] leading-[20px] text-on-surface-variant">Mostrando 1-4 de 1,284 usuarios</span>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-surface-container-high text-outline transition-colors disabled:opacity-30">
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-primary text-on-primary text-[12px] leading-[16px] tracking-[0.05em] font-bold">1</button>
                  <button className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-[12px] leading-[16px] tracking-[0.05em] font-bold">2</button>
                  <button className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-[12px] leading-[16px] tracking-[0.05em] font-bold">3</button>
                  <span className="text-outline">...</span>
                  <button className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-[12px] leading-[16px] tracking-[0.05em] font-bold">128</button>
                  <button className="p-2 rounded-lg hover:bg-surface-container-high text-outline transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full py-6 px-xl flex justify-between items-center max-w-[1440px] mx-auto bg-surface-container border-t border-outline-variant">
        <p className="text-[14px] leading-[20px] text-on-surface-variant">© 2024 Municipalidad del Cusco - Gestión de Residuos</p>
        <div className="flex gap-6">
          <a className="text-[14px] leading-[20px] text-on-surface-variant hover:text-primary transition-colors" href="#">Política de Privacidad</a>
          <a className="text-[14px] leading-[20px] text-on-surface-variant hover:text-primary transition-colors" href="#">Soporte</a>
          <a className="text-[14px] leading-[20px] text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1" href="#">
            <span className="w-2 h-2 rounded-full bg-waste-organic" />
            Estado del Sistema: Operativo
          </a>
        </div>
      </footer>
    </div>
  );
}
