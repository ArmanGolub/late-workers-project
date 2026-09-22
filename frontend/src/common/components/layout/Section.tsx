import { cn } from "@/common/lib/utils";
import { eyebrow } from "@/common/styles";
import { motion } from "framer-motion";

type SectionProps = {
  label?: string;
  divider?: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
};

export const Section = ({
  label,
  divider = true,
  delay = 0,
  className,
  children,
}: SectionProps) => (
  <motion.section
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className={cn(divider && "mt-24 border-t pt-10", className)}
  >
    {label && <p className={eyebrow}>{label}</p>}
    {children}
  </motion.section>
);
