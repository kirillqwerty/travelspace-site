import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/travelspace-logo.png";

export default function IntroScreen({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
        >
          <div className="flex flex-col items-center">
            {/* Logo */}
            <motion.img
              src={logo}
              alt="Travelspace"
              initial={{
                opacity: 0,
                scale: 0.86,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              transition={{
                duration: 1.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-20 h-20 object-contain"
            />

            {/* Title */}
            <motion.div
              initial={{
                opacity: 0,
                y: 14,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 1.1,
                delay: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-6 text-center will-change-transform"
            >
              <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.22em] text-neutral-900">
                TRAVELSPACE
              </h1>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
