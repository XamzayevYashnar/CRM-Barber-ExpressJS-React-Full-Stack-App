import React, { useRef } from 'react';
import { store } from '../lib/store';
import { X, Printer, Scissors, Sparkles, Smartphone, ArrowRight, ShieldCheck } from 'lucide-react';

interface QRPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRPosterModal: React.FC<QRPosterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const business = store.getBusiness();
  const posterRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate QR code SVG or high quality QR image url using standard QR service
  const bookingUrl = `${window.location.origin}/b/${business.slug}/`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    bookingUrl
  )}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Poster Container */}
        <div
          ref={posterRef}
          className="bg-white border-2 border-stone-900 rounded-3xl p-6 sm:p-8 text-center text-stone-900 relative shadow-inner"
        >
          
          {/* Top Brand */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <Scissors className="w-4 h-4 text-emerald-400 rotate-90" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">NAVBAT</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
            «{business.name}»
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-1">
            Jonli onlayn navbat tizimi • Kutishsiz qabul
          </p>

          {/* Big QR Code Frame */}
          <div className="my-6 p-4 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-300 inline-block mx-auto">
            <img
              src={qrImageUrl}
              alt="Barber House Navbat QR Kod"
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl mx-auto"
              crossOrigin="anonymous"
            />
          </div>

          {/* 3 Step Instructions */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left space-y-2.5 my-4">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <p className="text-xs font-semibold text-stone-800">
                Kamerani yoqing va QR kodni skanerlang
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <p className="text-xs font-semibold text-stone-800">
                Xizmat, usta va o'zingizga qulay vaqtni tanlang
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <p className="text-xs font-semibold text-stone-800">
                Navbatdagi o'rningizni telefonda jonli kuzating!
              </p>
            </div>
          </div>

          {/* Footer details */}
          <div className="pt-2 text-[11px] text-stone-500 space-y-0.5">
            <p className="font-semibold text-stone-800">{business.address}</p>
            <p>Tel: {business.phone} • Ish vaqti: {business.opens_at} - {business.closes_at}</p>
          </div>

        </div>

        {/* Print Button (hidden in print mode) */}
        <div className="mt-6 flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
          >
            Yopish
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Chop etish (Print / PDF)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
