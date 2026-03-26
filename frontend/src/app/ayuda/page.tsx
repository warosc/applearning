'use client';

import { useRouter } from 'next/navigation';
import {
  BookOpen, Clock, Flag, Send, CheckSquare,
  ChevronLeft, BarChart2, HelpCircle, MousePointer,
  AlignLeft, ToggleRight,
} from 'lucide-react';

interface HelpSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function HelpSection({ icon, title, children }: HelpSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-blue-600">{icon}</span>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-2 text-sm text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export default function AyudaPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </button>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900">Manual de Ayuda — Escobita Simulator</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Intro */}
        <div className="bg-blue-600 text-white rounded-xl p-5">
          <p className="text-base font-semibold mb-1">Bienvenido al Simulador Escobita</p>
          <p className="text-sm text-blue-100">
            Este simulador te ayuda a practicar para el examen de admisión. Lee este manual para sacarle
            el máximo provecho.
          </p>
        </div>

        <HelpSection icon={<BookOpen className="h-5 w-5" />} title="¿Cómo usar el simulador?">
          <Bullet>Entra a la página principal y haz clic en <strong>"Iniciar Simulador"</strong>.</Bullet>
          <Bullet>El sistema cargará un examen con preguntas de distintas materias.</Bullet>
          <Bullet>Responde cada pregunta a tu ritmo (o con el tiempo límite activo).</Bullet>
          <Bullet>Al terminar, haz clic en <strong>"Finalizar"</strong> para ver tus resultados.</Bullet>
        </HelpSection>

        <HelpSection icon={<MousePointer className="h-5 w-5" />} title="¿Cómo responder preguntas?">
          <Bullet>
            <strong>Opción única:</strong> Haz clic en la respuesta que creas correcta. Solo puedes seleccionar una.
          </Bullet>
          <Bullet>
            <strong>Opción múltiple:</strong> Haz clic en todas las respuestas que sean correctas. Puedes elegir varias.
          </Bullet>
          <Bullet>
            <strong>Completar oración (Fill Blank):</strong> Selecciona la palabra o frase que complete correctamente el enunciado.
          </Bullet>
          <Bullet>
            <strong>Multi-respuesta ponderada:</strong> Marca todas las opciones correctas. Cada una suma puntos parciales.
          </Bullet>
          <Bullet>
            <strong>Numérica:</strong> Escribe el número exacto como resultado.
          </Bullet>
          <Bullet>
            <strong>Arrastrar y soltar:</strong> Arrastra los elementos al orden correcto usando el icono <strong>⠿</strong>.
          </Bullet>
        </HelpSection>

        <HelpSection icon={<AlignLeft className="h-5 w-5" />} title="Navegación entre preguntas">
          <Bullet>
            Usa los botones <strong>"Anterior"</strong> y <strong>"Siguiente"</strong> para moverte entre preguntas.
          </Bullet>
          <Bullet>
            En el panel izquierdo (o menú en móvil) verás todos los números de pregunta. Haz clic en cualquiera para ir directamente.
          </Bullet>
          <Bullet>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-green-100 border border-green-400 inline-block" />
              <strong>Verde:</strong> Pregunta respondida.
            </span>
          </Bullet>
          <Bullet>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-300 inline-block" />
              <strong>Amarillo:</strong> Marcada para revisar.
            </span>
          </Bullet>
          <Bullet>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-white border border-gray-300 inline-block" />
              <strong>Blanco:</strong> Sin responder.
            </span>
          </Bullet>
        </HelpSection>

        <HelpSection icon={<Flag className="h-5 w-5" />} title="Marcar para revisar">
          <Bullet>
            Si no estás seguro de una respuesta, haz clic en <strong>"Marcar"</strong> en la parte superior derecha de la pregunta.
          </Bullet>
          <Bullet>
            Las preguntas marcadas aparecen con un punto amarillo en el panel de navegación.
          </Bullet>
          <Bullet>
            Puedes desmarcarla haciendo clic nuevamente en el botón <strong>"Marcada"</strong>.
          </Bullet>
          <Bullet>
            Al hacer clic en <strong>"Finalizar"</strong>, el sistema te mostrará cuántas preguntas tienes marcadas para que las revises.
          </Bullet>
        </HelpSection>

        <HelpSection icon={<Clock className="h-5 w-5" />} title="¿Cómo funciona el tiempo?">
          <Bullet>El temporizador aparece en la barra superior del examen.</Bullet>
          <Bullet>Cuando queden <strong>5 minutos</strong>, el reloj cambiará a <strong>color rojo</strong> como aviso.</Bullet>
          <Bullet>Si el tiempo se agota, el examen se enviará automáticamente con las respuestas que tengas hasta ese momento.</Bullet>
          <Bullet>Las respuestas se guardan automáticamente en cada cambio — no pierdas el acceso a internet.</Bullet>
        </HelpSection>

        <HelpSection icon={<Send className="h-5 w-5" />} title="¿Cómo enviar el examen?">
          <Bullet>
            Haz clic en el botón rojo <strong>"Finalizar"</strong> en la barra superior.
          </Bullet>
          <Bullet>
            Se abrirá una ventana de confirmación mostrando cuántas preguntas respondiste, omitiste y marcaste.
          </Bullet>
          <Bullet>
            Puedes regresar a revisar antes de confirmar el envío.
          </Bullet>
          <Bullet>
            Una vez enviado, <strong>no podrás modificar tus respuestas</strong>.
          </Bullet>
        </HelpSection>

        <HelpSection icon={<BarChart2 className="h-5 w-5" />} title="Resultados y calificación">
          <Bullet>Al finalizar verás tu puntaje total y porcentaje obtenido.</Bullet>
          <Bullet>Se mostrará un desglose por pregunta: correcta, incorrecta u omitida.</Bullet>
          <Bullet>
            <strong>Puntaje parcial:</strong> En preguntas de multi-respuesta ponderada, obtienes puntos por cada opción
            correcta que seleccionaste, aunque no hayas marcado todas.
          </Bullet>
          <Bullet>También verás el tiempo total que tomaste en el examen.</Bullet>
          <Bullet>Puedes revisar tu historial de intentos desde la sección <strong>"Historial"</strong>.</Bullet>
        </HelpSection>

        <HelpSection icon={<ToggleRight className="h-5 w-5" />} title="Herramientas disponibles">
          <Bullet>
            <strong>Calculadora:</strong> Si el examen la tiene habilitada, aparece en el panel derecho. Úsala para cálculos matemáticos.
          </Bullet>
          <Bullet>
            <strong>Pantalla completa:</strong> Se recomienda usar el simulador en pantalla completa para evitar distracciones.
          </Bullet>
          <Bullet>
            <strong>Guardado automático:</strong> Tus respuestas se guardan automáticamente. No necesitas hacer nada extra.
          </Bullet>
        </HelpSection>

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="h-5 w-5 text-amber-600" />
            <p className="font-semibold text-amber-800">Consejos para el examen</p>
          </div>
          <div className="space-y-1.5 text-sm text-amber-900">
            {[
              'Lee cada pregunta con calma antes de responder.',
              'Si no sabes una respuesta, márcala para revisarla al final.',
              'Revisa el progreso en el panel lateral para no dejar preguntas sin responder.',
              'En preguntas de multi-respuesta, lee TODAS las opciones antes de elegir.',
              'Administra tu tiempo: no dediques demasiado a una sola pregunta.',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="font-bold text-amber-600 flex-shrink-0">{i + 1}.</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 pb-4">
          Escobita Simulator — Guía del estudiante
        </div>
      </main>
    </div>
  );
}
