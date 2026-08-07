import { HomeClient } from "./HomeClient";
import { IntegratedGrowthPrototype } from "@/features/growth-v2/integrated/IntegratedGrowthPrototype";

export default function Home() {
  const isGrowthStaging =
    process.env.VERCEL_TARGET_ENV === "staging" ||
    process.env.NEXT_PUBLIC_GROWTH_PREVIEW_ENV === "staging";

  if (isGrowthStaging) {
    return <IntegratedGrowthPrototype />;
  }

  return <HomeClient />;
}
