import React from "react";
import { X } from "lucide-react";

interface FocusTimerModalProps {
  onClose: () => void;
}

/**
 * FocusTimerModal renders a modal dialog for starting a focus timer.
 *
 * It closely follows the provided design: a dark overlay with a centered card,
 * a title and description, a circular countdown display, preset duration
 * selectors, a helpful tip, and cancel/start actions. Tailwind CSS classes are
 * used extensively to mirror spacing, colors, and typography from the mockup.
 */
export default function FocusTimerModal({ onClose }: FocusTimerModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10">
        {/* Close button */}
        <button
          aria-label="Fechar"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Timer de Foco</h2>
        <p className="text-gray-500 text-sm mb-8">
          Defina um intervalo de estudo e acompanhe o tempo em foco.
        </p>

        {/* Circular timer display */}
        <div className="mx-auto mb-6 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center w-40 h-40 rounded-full border-4 border-gray-200">
            <span className="text-4xl font-semibold text-gray-900">25:00</span>
            <span className="text-sm text-gray-500 mt-1">minutos</span>
          </div>
        </div>

        {/* Duration presets */}
        <div className="flex justify-center gap-4 mb-6">
          {/* 15 min button */}
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            15&nbsp;min
          </button>
          {/* 25 min button (active) */}
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg"
          >
            25&nbsp;min
          </button>
          {/* 50 min button */}
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            50&nbsp;min
          </button>
        </div>

        {/* Tip section */}
        <div className="bg-gray-50 rounded-md p-4 mb-6">
          <span className="font-medium text-gray-900">Dica:&nbsp;</span>
          <span className="text-gray-600 text-sm">
            use blocos de tempo curtos para manter a concentração.
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500"
          >
            Iniciar
          </button>
        </div>
      </div>
    </div>
  );
}
