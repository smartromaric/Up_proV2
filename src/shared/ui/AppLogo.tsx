import Image from "next/image";
import { APP_LOGO_ALT, APP_LOGO_SRC } from "@/shared/brand/logo";

type AppLogoSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<AppLogoSize, string> = {
  sm: "h-7 w-auto",
  md: "h-9 w-auto",
  lg: "h-12 w-auto",
};

interface AppLogoProps {
  size?: AppLogoSize;
  subtitle?: string;
  className?: string;
}

export function AppLogo({ size = "md", subtitle, className = "" }: AppLogoProps) {
  return (
    <div className={className}>
      <Image
        src={APP_LOGO_SRC}
        alt={APP_LOGO_ALT}
        width={200}
        height={64}
        priority
        className={`object-contain object-left ${SIZE_CLASS[size]}`}
      />
      {subtitle ? (
        <p className="mt-1 text-xs text-muted">Pro · {subtitle}</p>
      ) : null}
    </div>
  );
}
