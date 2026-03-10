'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, CheckCircle2, ExternalLink } from 'lucide-react';

const CONFIG_KEY = 'exhcoba_admin_config';

const configSchema = z.object({
  defaultDurationMinutes: z.number().min(5).max(300),
  calculatorEnabledByDefault: z.boolean(),
  defaultNavigationType: z.enum(['free', 'sequential']),
});

type ConfigForm = z.infer<typeof configSchema>;

const DEFAULT_CONFIG: ConfigForm = {
  defaultDurationMinutes: 120,
  calculatorEnabledByDefault: true,
  defaultNavigationType: 'free',
};

function loadConfig(): ConfigForm {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_CONFIG;
}

export default function ConfigPage() {
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: DEFAULT_CONFIG,
  });

  useEffect(() => {
    reset(loadConfig());
  }, [reset]);

  const onSubmit = (data: ConfigForm) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Simulator defaults */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
          <h2 className="font-semibold text-gray-800 border-b pb-3">Valores predeterminados de simuladores</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duración predeterminada (minutos)
            </label>
            <input
              type="number"
              {...register('defaultDurationMinutes', { valueAsNumber: true })}
              className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.defaultDurationMinutes && (
              <p className="mt-1 text-xs text-red-600">{errors.defaultDurationMinutes.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="calculatorEnabled"
              {...register('calculatorEnabledByDefault')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="calculatorEnabled" className="text-sm text-gray-700">
              Calculadora habilitada por defecto
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modo de navegación predeterminado
            </label>
            <select
              {...register('defaultNavigationType')}
              className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="free">Libre (puede saltar preguntas)</option>
              <option value="sequential">Secuencial (una por una)</option>
            </select>
          </div>
        </div>

        {/* System info */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-3">Información del sistema</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Plataforma</p>
              <p className="font-medium text-gray-800">EXHCOBA Simulator v1.0</p>
            </div>
            <div>
              <p className="text-gray-500">Backend</p>
              <p className="font-medium text-gray-800">FastAPI + PostgreSQL</p>
            </div>
            <div>
              <p className="text-gray-500">Frontend</p>
              <p className="font-medium text-gray-800">Next.js 14</p>
            </div>
          </div>

          <a
            href="http://localhost:4000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Documentación API (Swagger)
          </a>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Save className="h-4 w-4" />
            Guardar configuración
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Guardado
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
