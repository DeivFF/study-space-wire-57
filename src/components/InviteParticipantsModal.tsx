import React from "react";
import { X, Star, Plus } from "lucide-react";

/**
 * InviteParticipantsModal renders a modal overlay for inviting new users.
 *
 * This component matches the provided design closely using Tailwind CSS for styling.
 * It features a dark backdrop, a centered white card, an email/username input
 * field, a primary action button with an icon, a list of pending invites,
 * and a close button in the top‑right corner of the card.
 */

interface InviteParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteParticipantsModal({ isOpen, onClose }: InviteParticipantsModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-4 z-50" onClick={onClose}>
      {/* Modal card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          aria-label="Fechar"
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Convidar Participantes</h2>
        <p className="text-gray-500 text-sm mb-5">
          Digite o e-mail ou nome de usuário para enviar um convite.
        </p>

        {/* Input field */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="E-mail ou nome de usuário"
            className="w-full rounded-lg border border-gray-300 bg-white py-3 px-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Primary invite button */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium mb-6 transition-colors"
        >
          {/* Icon with star and plus layered */}
          <span className="flex items-center justify-center bg-blue-700 rounded-md p-1.5">
            <Star className="w-4 h-4 text-white" strokeWidth={2} />
            <Plus className="w-3 h-3 -ml-2 text-white" strokeWidth={2} />
          </span>
          <span className="truncate">Enviar Convite</span>
        </button>

        {/* Divider */}
        <hr className="border-gray-200 mb-4" />

        {/* Pending invites section */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">Convites Pendentes</h3>
          {/* List of pending invites */}
          <div className="divide-y divide-gray-200">
            {/* Invite row: Amanda Lopes */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold">
                  A
                </div>
                <div className="leading-tight">
                  <div className="font-medium text-gray-900">Amanda Lopes</div>
                  <div className="text-gray-500 text-sm">Enviado há 5&nbsp;min</div>
                </div>
              </div>
              <button
                type="button"
                className="bg-red-500 hover:bg-red-400 text-white py-2 px-4 rounded-lg text-sm font-medium"
              >
                Revogar
              </button>
            </div>

            {/* Invite row: Ricardo Souza */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold">
                  R
                </div>
                <div className="leading-tight">
                  <div className="font-medium text-gray-900">Ricardo Souza</div>
                  <div className="text-gray-500 text-sm">Enviado há 15&nbsp;min</div>
                </div>
              </div>
              <button
                type="button"
                className="bg-red-500 hover:bg-red-400 text-white py-2 px-4 rounded-lg text-sm font-medium"
              >
                Revogar
              </button>
            </div>

            {/* Invite row: Paulo Henrique */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold">
                  P
                </div>
                <div className="leading-tight">
                  <div className="font-medium text-gray-900">Paulo Henrique</div>
                  <div className="text-gray-500 text-sm">Enviado há 30&nbsp;min</div>
                </div>
              </div>
              <button
                type="button"
                className="bg-red-500 hover:bg-red-400 text-white py-2 px-4 rounded-lg text-sm font-medium"
              >
                Revogar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
