"use client";

import { useState } from "react";

export default function ConfiguracionPage() {
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved"
  >("idle");

  const handleSave = () => {
    setSaveState("saving");
    setTimeout(() => {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    }, 1200);
  };

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      <header className="flex justify-between items-center w-full px-lg py-md max-w-[1440px] mx-auto bg-surface border-b border-outline-variant shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-lg">
          <span className="text-[24px] leading-[32px] font-extrabold text-primary">
            Terra Civic Admin
          </span>
          <div className="relative w-64 md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-[14px] leading-[20px] focus:ring-2 focus:ring-primary"
              placeholder="Buscar configuración..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors active:scale-95">
            <span className="material-symbols-outlined text-on-surface-variant">
              notifications
            </span>
          </button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors active:scale-95">
            <span className="material-symbols-outlined text-on-surface-variant">
              help
            </span>
          </button>
          <div className="w-px h-6 bg-outline-variant mx-2" />
          <div className="flex items-center gap-sm cursor-pointer hover:bg-surface-container-high p-1 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              <span className="material-symbols-outlined text-sm">person</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold hidden lg:block">
              Usuario Admin
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-lg custom-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-lg">
          <div className="flex flex-col gap-xs mb-xl">
            <h2 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-primary">
              Configuración del Sistema
            </h2>
            <p className="text-[16px] leading-[24px] text-on-surface-variant">
              Manage global configurations, notification parameters, and data
              security for Llaqta Limpia.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
            <div className="lg:col-span-7 bg-surface-card rounded-xl shadow-sm border border-outline-variant p-lg flex flex-col gap-lg">
              <div className="flex items-center gap-md">
                <span className="material-symbols-outlined text-primary p-2 bg-primary-fixed rounded-lg">
                  settings_applications
                </span>
                <h3 className="text-[24px] leading-[32px] font-bold text-on-surface">
                  Configuración General
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="flex flex-col gap-xs">
                  <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant">
                    System Language
                  </label>
                  <select className="bg-surface border-outline-variant rounded-lg text-[16px] leading-[24px] py-sm focus:ring-primary focus:border-primary">
                    <option>Español (Perú)</option>
                    <option>Quechua (Cusco)</option>
                    <option>Inglés</option>
                  </select>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant">
                    Timezone
                  </label>
                  <select className="bg-surface border-outline-variant rounded-lg text-[16px] leading-[24px] py-sm focus:ring-primary focus:border-primary">
                    <option>GMT-05:00 (Cusco/Peru)</option>
                    <option>GMT-05:00 (Lima)</option>
                  </select>
                </div>
              </div>
              <div className="bg-surface-container p-md rounded-lg flex items-center justify-between border border-outline-variant">
                <div>
                  <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface">
                    Modo Mantenimiento
                  </p>
                  <p className="text-[14px] leading-[20px] text-on-surface-variant">
                    Disable citizen reporting during system updates.
                  </p>
                </div>
                <button
                  className={`w-12 h-6 rounded-full p-1 transition-colors relative cursor-pointer ${
                    maintenanceMode ? "bg-primary" : "bg-outline-variant"
                  }`}
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      maintenanceMode ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-surface-card rounded-xl shadow-sm border border-outline-variant p-lg flex flex-col gap-md">
              <div className="flex items-center gap-md">
                <span className="material-symbols-outlined text-secondary p-2 bg-secondary-fixed rounded-lg">
                  palette
                </span>
                <h3 className="text-[24px] leading-[32px] font-bold text-on-surface">
                  Marca e Identidad
                </h3>
              </div>
              <div className="flex items-center gap-lg">
                <div className="relative w-20 h-20 bg-surface-container rounded-lg flex items-center justify-center border-2 border-dashed border-outline">
                  <span className="material-symbols-outlined text-outline text-3xl">
                    cloud_upload
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-xs">
                  <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                    System Logo
                  </p>
                  <p className="text-[14px] leading-[20px] text-on-surface-variant">
                    Upload SVG or PNG (max 2MB).
                  </p>
                  <button className="mt-1 text-primary text-[12px] leading-[16px] tracking-[0.05em] font-bold text-left hover:underline">
                    Change Logo
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-xs pt-md border-t border-outline-variant">
                <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant">
                  Correo de Soporte
                </label>
                <input
                  className="bg-surface border-outline-variant rounded-lg text-[14px] leading-[20px] py-xs focus:ring-primary focus:border-primary"
                  type="email"
                  defaultValue="soporte@llaqtalimpia.cusco.gob.pe"
                />
              </div>
            </div>

            <div className="lg:col-span-6 bg-surface-card rounded-xl shadow-sm border border-outline-variant p-lg flex flex-col gap-lg">
              <div className="flex items-center gap-md">
                <span className="material-symbols-outlined text-tertiary p-2 bg-tertiary-fixed rounded-lg">
                  notifications_active
                </span>
                <h3 className="text-[24px] leading-[32px] font-bold text-on-surface">
                  Motor de Notificaciones
                </h3>
              </div>
              <div className="space-y-md">
                <div className="flex flex-col gap-sm">
                  <div className="flex justify-between items-center">
                    <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                      Citizen Proximity Threshold
                    </p>
                    <span className="text-primary font-bold">500 meters</span>
                  </div>
                  <input
                    className="w-full accent-primary"
                    max={2000}
                    min={100}
                    step={100}
                    type="range"
                    defaultValue={500}
                  />
                  <p className="text-[14px] leading-[20px] text-on-surface-variant">
                    Radius for &quot;Truck nearby&quot; push notifications.
                  </p>
                </div>
                <div className="flex flex-col gap-sm pt-md border-t border-outline-variant">
                  <div className="flex justify-between items-center">
                    <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                      Delay Alert Trigger
                    </p>
                    <span className="text-primary font-bold">15 mins</span>
                  </div>
                  <input
                    className="w-full accent-primary"
                    max={60}
                    min={5}
                    step={5}
                    type="range"
                    defaultValue={15}
                  />
                  <p className="text-[14px] leading-[20px] text-on-surface-variant">
                    Threshold before notifying citizens of route delays.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-surface-card rounded-xl shadow-sm border border-outline-variant p-lg flex flex-col gap-lg">
              <div className="flex items-center gap-md">
                <span className="material-symbols-outlined text-primary p-2 bg-primary-fixed rounded-lg">
                  schedule
                </span>
                <h3 className="text-[24px] leading-[32px] font-bold text-on-surface">
                  Zonas y Horarios
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant">
                    Default Start Hour
                  </label>
                  <input
                    className="bg-surface border-outline-variant rounded-lg text-[16px] leading-[24px] py-sm focus:ring-primary focus:border-primary"
                    type="time"
                    defaultValue="05:00"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant">
                    Default End Hour
                  </label>
                  <input
                    className="bg-surface border-outline-variant rounded-lg text-[16px] leading-[24px] py-sm focus:ring-primary focus:border-primary"
                    type="time"
                    defaultValue="21:00"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                  Waste Assignments
                </p>
                <div className="flex flex-wrap gap-sm">
                  <span className="flex items-center gap-xs px-3 py-1 bg-green-100 text-green-900 rounded-full text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                    <span className="material-symbols-outlined text-sm">eco</span>
                    Orgánico
                  </span>
                  <span className="flex items-center gap-xs px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                    <span className="material-symbols-outlined text-sm">recycling</span>
                    Reciclable
                  </span>
                  <span className="flex items-center gap-xs px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                    <span className="material-symbols-outlined text-sm">delete</span>
                    General
                  </span>
                  <button className="flex items-center gap-xs px-3 py-1 border border-dashed border-outline rounded-full text-[12px] leading-[16px] tracking-[0.05em] font-bold text-outline hover:border-primary hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Assign New
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-12 bg-inverse-surface text-inverse-on-surface rounded-xl shadow-xl p-lg flex flex-col md:flex-row gap-xl">
              <div className="md:w-1/3 flex flex-col gap-md">
                <div className="flex items-center gap-md">
                  <span className="material-symbols-outlined text-primary-fixed-dim p-2 bg-primary-container rounded-lg">
                    security
                  </span>
                  <h3 className="text-[24px] leading-[32px] font-bold">
                    Data & Security
                  </h3>
                </div>
                <p className="text-[14px] leading-[20px] opacity-80">
                  Configure critical data flow between municipal databases and
                  the Llaqta Limpia cloud engine.
                </p>
                <button className="w-full bg-primary-fixed-dim text-primary text-[12px] leading-[16px] tracking-[0.05em] font-bold py-md rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-sm">
                  <span className="material-symbols-outlined">history</span> View
                  Audit Logs
                </button>
              </div>
              <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-lg">
                <div className="bg-primary-container/30 p-md rounded-lg border border-primary-container">
                  <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary-fixed-dim uppercase tracking-widest text-[10px]">
                    API Sync Interval
                  </p>
                  <div className="flex items-center justify-between mt-sm">
                    <p className="text-[24px] leading-[32px] font-bold">
                      Every 5m
                    </p>
                    <button className="text-primary-fixed-dim material-symbols-outlined">
                      edit
                    </button>
                  </div>
                </div>
                <div className="bg-primary-container/30 p-md rounded-lg border border-primary-container">
                  <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary-fixed-dim uppercase tracking-widest text-[10px]">
                    Last Backup
                  </p>
                  <div className="flex items-center justify-between mt-sm">
                    <p className="text-[24px] leading-[32px] font-bold">
                      2h ago
                    </p>
                    <button className="bg-primary-fixed-dim text-primary px-3 py-1 rounded-full text-[10px] font-bold">
                      RETRY
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2 flex items-center gap-md p-md bg-white/5 rounded-lg border border-white/10">
                  <span className="material-symbols-outlined text-status-alert">
                    warning
                  </span>
                  <div className="flex-1">
                    <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                      Data Privacy Protocol
                    </p>
                    <p className="text-[14px] leading-[20px] opacity-60">
                      Citizen PII is currently being encrypted using AES-256
                      standards.
                    </p>
                  </div>
                  <button className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary-fixed-dim">
                    Manage Keys
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-md pt-lg mb-xl">
            <button className="px-xl py-md text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors">
              Descartar Cambios
            </button>
            <button
              className={`px-xl py-md text-[12px] leading-[16px] tracking-[0.05em] font-bold text-white rounded-lg shadow-sm transition-all flex items-center gap-2 ${
                saveState === "saved"
                  ? "bg-waste-organic"
                  : "bg-primary hover:opacity-90"
              }`}
              onClick={handleSave}
              disabled={saveState === "saving"}
            >
              {saveState === "saving" && (
                <span className="material-symbols-outlined animate-spin">
                  sync
                </span>
              )}
              {saveState === "saved" && (
                <span className="material-symbols-outlined">check_circle</span>
              )}
              {saveState === "idle" && "Guardar Configuración"}
              {saveState === "saving" && "Saving..."}
              {saveState === "saved" && "Saved Successfully"}
            </button>
          </div>
        </div>
      </div>

      <footer className="w-full py-lg px-xl flex justify-between items-center max-w-[1440px] mx-auto bg-surface-container border-t border-outline-variant shrink-0">
        <p className="text-[14px] leading-[20px] text-on-surface-variant">
          © 2024 Municipalidad del Cusco - Gestión de Residuos
        </p>
        <div className="flex gap-lg">
          <a
            className="text-[14px] leading-[20px] text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Política de Privacidad
          </a>
          <a
            className="text-[14px] leading-[20px] text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Soporte
          </a>
          <a
            className="text-[14px] leading-[20px] text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Estado del Sistema
          </a>
        </div>
      </footer>
    </div>
  );
}
