/* eslint-disable @next/next/no-img-element */
// Official Bright Horizon Institute logo (public/logo.png, public/logo-white.png)

export function LogoMark({ size = 40, light = false, className = "" }) {
  return (
    <img
      src={light ? "/logo-white.png" : "/logo.png"}
      width={size}
      height={size}
      alt="Bright Horizon Institute logo"
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

export default function Logo({ size = 40, light = false, stacked = false }) {
  return (
    <div className={`flex items-center gap-3 ${stacked ? "flex-col text-center" : ""}`}>
      <LogoMark size={size} light={light} />
      <div className="leading-tight">
        <div className={`font-display font-semibold ${stacked ? "text-3xl" : "text-lg"} ${light ? "text-white" : "text-ink"}`}>
          Bright Horizon Institute
        </div>
        <div className={`${stacked ? "text-base" : "text-xs"} ${light ? "text-white/70" : "text-ink/60"}`}>
          Examination Portal
        </div>
      </div>
    </div>
  );
}
