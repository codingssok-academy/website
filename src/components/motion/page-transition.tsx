"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const variants = {
    initial: { opacity: 0, y: 16, scale: 0.99, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, y: -12, scale: 0.995, filter: "blur(6px)" },
};

export function PageTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                    duration: 0.35,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    filter: { duration: 0.4 },
                    scale: { type: "spring", stiffness: 300, damping: 30 },
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
