import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad - Eco Track Wanchaq',
  description:
    'Cómo Eco Track Wanchaq recopila, usa y protege los datos personales de sus usuarios.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen px-5 py-10 bg-gradient-to-b from-surface to-surface-container-low">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center justify-center p-3 bg-primary-container rounded-2xl shadow-lg shadow-primary/20">
            <span
              className="material-symbols-outlined text-on-primary-container text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              privacy_tip
            </span>
          </div>
          <h1 className="text-[28px] leading-[36px] font-extrabold text-primary mb-2">
            Política de Privacidad
          </h1>
          <p className="text-[14px] leading-[20px] text-on-surface-variant">
            Última actualización: 24 de julio de 2026
          </p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xl shadow-primary/5 border border-outline-variant/20 space-y-6 text-[14px] leading-[22px] text-on-surface">
          <section>
            <h2 className="text-[16px] leading-[24px] font-bold text-primary mb-2">
              1. Quiénes somos
            </h2>
            <p>
              Eco Track Wanchaq es un sistema de monitoreo de recolección de residuos sólidos
              desarrollado por la UNSAAC para la Municipalidad de Wanchaq, Cusco. Esta política
              explica qué datos personales recopilamos de las personas que usan la aplicación
              (ciudadanos, conductores y personal municipal) y cómo los tratamos, conforme a la
              Ley N.º 29733, Ley de Protección de Datos Personales del Perú, y su reglamento.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] leading-[24px] font-bold text-primary mb-2">
              2. Datos que recopilamos
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Datos de cuenta:</strong> nombre completo, correo electrónico y
                contraseña (almacenada solo como hash, nunca en texto plano).
              </li>
              <li>
                <strong>Alarmas ciudadanas:</strong> las rutas y puntos de recojo que eliges
                seguir, para avisarte antes de que pase el camión recolector.
              </li>
              <li>
                <strong>Ubicación de vehículos y rutas:</strong> si eres conductor, registramos
                la posición GPS del vehículo asignado mientras cumples tu turno, para mostrar el
                recorrido en tiempo real a los ciudadanos.
              </li>
              <li>
                <strong>Incidencias y reportes:</strong> la información que envías al reportar un
                problema (por ejemplo, un punto de acumulación de basura).
              </li>
              <li>
                <strong>Datos técnicos:</strong> registros de errores de la aplicación mediante
                Sentry, con grabaciones de sesión (session replay) donde el texto y los medios se
                ocultan automáticamente para no exponer información sensible.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] leading-[24px] font-bold text-primary mb-2">
              3. Para qué usamos tus datos
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Operar tu cuenta e identificarte al iniciar sesión.</li>
              <li>Enviarte notificaciones de las alarmas que configuraste.</li>
              <li>Mostrar el recorrido de los vehículos de recolección en el mapa.</li>
              <li>Dar seguimiento a incidencias reportadas por la ciudadanía.</li>
              <li>Detectar y corregir errores técnicos de la aplicación.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] leading-[24px] font-bold text-primary mb-2">
              4. Con quién compartimos tus datos
            </h2>
            <p>
              No vendemos ni cedemos tus datos personales a terceros con fines comerciales. La
              ubicación de los vehículos es visible para los ciudadanos dentro de la app, como
              parte del servicio. Usamos proveedores de infraestructura (base de datos, hosting y
              monitoreo de errores) únicamente para operar el servicio, bajo acuerdos de
              confidencialidad.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] leading-[24px] font-bold text-primary mb-2">
              5. Cuánto tiempo conservamos tus datos
            </h2>
            <p>
              Conservamos los datos de tu cuenta mientras esté activa. Los registros de ubicación
              de rutas se conservan el tiempo necesario para fines operativos y estadísticos del
              servicio de recolección. Puedes solicitar la eliminación de tu cuenta en cualquier
              momento.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] leading-[24px] font-bold text-primary mb-2">
              6. Tus derechos
            </h2>
            <p>
              Como titular de tus datos, puedes ejercer tus derechos de acceso, rectificación,
              cancelación y oposición (derechos ARCO) escribiéndonos a través de los canales de
              contacto de la Municipalidad de Wanchaq o del equipo del proyecto en la UNSAAC.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] leading-[24px] font-bold text-primary mb-2">
              7. Seguridad
            </h2>
            <p>
              Las contraseñas se almacenan con hash (bcrypt), las sesiones se protegen con tokens
              JWT y las comunicaciones con el servidor se realizan mediante HTTPS. Aplicamos
              controles de acceso según el rol del usuario (ciudadano, conductor o
              administrador).
            </p>
          </section>

          <section>
            <h2 className="text-[16px] leading-[24px] font-bold text-primary mb-2">
              8. Cambios a esta política
            </h2>
            <p>
              Podemos actualizar esta política cuando cambien las funciones de la app. Si el
              cambio es relevante, lo indicaremos dentro de la aplicación.
            </p>
          </section>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-[13px] font-bold text-primary hover:underline"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
