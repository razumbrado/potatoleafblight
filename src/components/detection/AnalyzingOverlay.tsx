import { AnimatePresence, motion } from 'framer-motion';
import { ScanLine } from 'lucide-react';

/** Scanning animation shown over the image preview while the model is running. */
export function AnalyzingOverlay({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="absolute inset-0 z-10 flex flex-col items-center justify-end overflow-hidden rounded-3xl bg-forest/55 p-6 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-none absolute inset-x-0 h-24 animate-scan" style={{ marginTop: '-3rem' }} aria-hidden>
            <div className="h-full w-full bg-gradient-to-b from-transparent via-soft/35 to-transparent" />
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-soft shadow-[0_0_18px_4px_rgb(116_198_157/0.7)]" />
          </div>
          <span className="pointer-events-none absolute left-5 top-5 h-8 w-8 rounded-tl-xl border-l-2 border-t-2 border-soft" aria-hidden />
          <span className="pointer-events-none absolute right-5 top-5 h-8 w-8 rounded-tr-xl border-r-2 border-t-2 border-soft" aria-hidden />
          <span className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 rounded-bl-xl border-b-2 border-l-2 border-soft" aria-hidden />
          <span className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 rounded-br-xl border-b-2 border-r-2 border-soft" aria-hidden />

          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative flex items-center gap-3 rounded-2xl bg-forest/90 px-5 py-3.5 text-white shadow-lift ring-1 ring-white/15"
          >
            <ScanLine className="h-5 w-5 text-soft" aria-hidden />
            <div className="text-left">
              <p className="text-sm font-bold">Analyzing leaf image…</p>
              <p className="text-xs text-white/70">Running the trained model in your browser</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
