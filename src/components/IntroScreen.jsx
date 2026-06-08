import { motion, AnimatePresence } from "framer-motion";
import logoBlack from "@/assets/logo-travelspace-black.png";

export default function IntroScreen({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.45,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
        >
          <motion.img
            src={logoBlack}
            alt="TRAVELSPACE"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              delay: 0.25,
              duration: 0.65,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="h-auto w-[230px] object-contain sm:w-[300px]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
