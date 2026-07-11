import type { ReactNode } from "react";
import { GrowthPreviewStateProvider } from "@/features/growth-v2/components/GrowthPreviewStateProvider";

export default function GrowthPreviewLayout({ children }: { children: ReactNode }) {
  return <GrowthPreviewStateProvider>{children}</GrowthPreviewStateProvider>;
}
