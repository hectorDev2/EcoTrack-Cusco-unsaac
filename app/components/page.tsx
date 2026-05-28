'use client';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/hooks/use-toast';
import { WASTE_CATEGORY_COLORS, WASTE_CATEGORY_LABELS } from '@/lib/waste-colors';
import { STATUS_CONFIG, INCIDENT_TYPE_LABELS } from '@/lib/status';

// Interactive Toast Demo component (must use hook inside to satisfy React rules)
function ToastDemo() {
  const { addToast } = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="primary"
        size="md"
        icon="check_circle"
        onClick={() => addToast('success', 'Incidente resuelto exitosamente')}
      >
        Success
      </Button>
      <Button
        variant="danger"
        size="md"
        icon="error"
        onClick={() => addToast('error', 'Error al procesar la solicitud')}
      >
        Error
      </Button>
      <Button
        variant="secondary"
        size="md"
        icon="warning"
        onClick={() => addToast('warning', 'Capacidad al 90% - considerar recolección')}
      >
        Warning
      </Button>
      <Button
        variant="ghost"
        size="md"
        icon="info"
        onClick={() => addToast('info', 'Nuevo contenedor disponible en zona norte')}
      >
        Info
      </Button>
    </div>
  );
}

export default function ComponentsPage() {
  const wasteCategories = Object.keys(WASTE_CATEGORY_LABELS);
  const statusKeys = Object.keys(STATUS_CONFIG);
  const incidentTypes = Object.keys(INCIDENT_TYPE_LABELS);

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-surface-container-low border-b border-outline px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary text-[32px]">dashboard</span>
            <h1 className="text-3xl font-bold text-on-surface tracking-tight">
              UI Components
            </h1>
          </div>
          <p className="text-on-surface-variant text-lg">
            Documentación interactiva de componentes
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-12">

        {/* Button Section */}
        <section className="animate-fade-in-up stagger-1">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary text-[24px]">smart_button</span>
            <h2 className="text-xl font-bold text-on-surface">Button</h2>
          </div>

          {/* Variants */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
              Variantes
            </h3>
            <div className="flex flex-wrap gap-4 p-6 bg-surface-container-low rounded-2xl border border-outline">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
              Tamaños
            </h3>
            <div className="flex flex-wrap items-center gap-4 p-6 bg-surface-container-low rounded-2xl border border-outline">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
          </div>

          {/* With Icons */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
              Con Iconos
            </h3>
            <div className="flex flex-wrap gap-4 p-6 bg-surface-container-low rounded-2xl border border-outline">
              <Button variant="primary" icon="add">Agregar</Button>
              <Button variant="secondary" icon="edit">Editar</Button>
              <Button variant="ghost" icon="delete">Eliminar</Button>
              <Button variant="primary" iconRight="arrow_forward">Continuar</Button>
            </div>
          </div>

          {/* Loading State */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
              Estado de Carga
            </h3>
            <div className="flex flex-wrap gap-4 p-6 bg-surface-container-low rounded-2xl border border-outline">
              <Button variant="primary" loading>Cargando</Button>
              <Button variant="secondary" loading>Procesando</Button>
              <Button variant="danger" loading>Eliminando</Button>
            </div>
          </div>

          {/* Disabled State */}
          <div>
            <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
              Deshabilitado
            </h3>
            <div className="flex flex-wrap gap-4 p-6 bg-surface-container-low rounded-2xl border border-outline">
              <Button variant="primary" disabled>Primary</Button>
              <Button variant="secondary" disabled>Secondary</Button>
              <Button variant="ghost" disabled>Ghost</Button>
              <Button variant="danger" disabled>Danger</Button>
            </div>
          </div>
        </section>

        {/* Badge Section */}
        <section className="animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary text-[24px]">label</span>
            <h2 className="text-xl font-bold text-on-surface">Badge</h2>
          </div>

          {/* Status Badges */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
              Estados de Incidente
            </h3>
            <div className="flex flex-wrap gap-3 p-6 bg-surface-container-low rounded-2xl border border-outline">
              {statusKeys.map(status => (
                <Badge key={status} variant="status">
                  {STATUS_CONFIG[status].label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Waste Type Badges */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
              Tipos de Residuos
            </h3>
            <div className="flex flex-wrap gap-3 p-6 bg-surface-container-low rounded-2xl border border-outline">
              {wasteCategories.map(category => (
                <Badge key={category} variant="waste">
                  {WASTE_CATEGORY_LABELS[category]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Role Badges */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
              Roles de Usuario
            </h3>
            <div className="flex flex-wrap gap-3 p-6 bg-surface-container-low rounded-2xl border border-outline">
              <Badge variant="role">ADMIN</Badge>
              <Badge variant="role">CITIZEN</Badge>
              <Badge variant="role">DRIVER</Badge>
            </div>
          </div>

          {/* Incident Type Badges */}
          <div>
            <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
              Tipos de Incidente
            </h3>
            <div className="flex flex-wrap gap-3 p-6 bg-surface-container-low rounded-2xl border border-outline">
              {incidentTypes.map(type => (
                <Badge key={type} variant="neutral">
                  {INCIDENT_TYPE_LABELS[type]}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Spinner Section */}
        <section className="animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary text-[24px]">progress_activity</span>
            <h2 className="text-xl font-bold text-on-surface">Spinner</h2>
          </div>

          {/* Sizes */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
              Tamaños
            </h3>
            <div className="flex items-center gap-12 p-6 bg-surface-container-low rounded-2xl border border-outline">
              <div className="flex flex-col items-center gap-2">
                <Spinner size="sm" />
                <span className="text-xs text-on-surface-variant">Small</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="md" />
                <span className="text-xs text-on-surface-variant">Medium</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="lg" />
                <span className="text-xs text-on-surface-variant">Large</span>
              </div>
            </div>
          </div>

          {/* In Context */}
          <div>
            <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
              En Contexto
            </h3>
            <div className="p-6 bg-surface-container-low rounded-2xl border border-outline">
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
                <span className="ml-4 text-on-surface-variant">Cargando datos...</span>
              </div>
            </div>
          </div>
        </section>

        {/* Toast Section */}
        <section className="animate-fade-in-up stagger-4">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary text-[24px]">notifications</span>
            <h2 className="text-xl font-bold text-on-surface">Toast</h2>
          </div>

          {/* Interactive Demo */}
          <div>
            <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
              Demo Interactivo
            </h3>
            <div className="p-6 bg-surface-container-low rounded-2xl border border-outline">
              <p className="text-on-surface-variant mb-6 text-sm">
                Haz clic en los botones para ver diferentes tipos de notificaciones:
              </p>
              <ToastDemo />
            </div>
          </div>
        </section>

      </main>

      {/* Footer spacing */}
      <div className="h-16" />
    </div>
  );
}