interface StampProps {
  text?: string;
  className?: string;
}

export function Stamp({
  text = "MIMOSA PILATES • REFORMER STUDIO • KAMIONKI • ",
  className = "",
}: StampProps) {
  const chars = text.split("");
  const radius = 60;

  return (
    <div className={`relative h-36 w-36 ${className}`}>
      <svg viewBox="0 0 160 160" className="absolute inset-0 h-full w-full animate-spin-slow">
        <defs>
          <path
            id="stamp-circle"
            d={`M 80,80 m -${radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`}
          />
        </defs>
        <text className="fill-current text-[10px] tracking-[0.25em]" style={{ fontFamily: "Inter, sans-serif" }}>
          <textPath href="#stamp-circle">
            {chars.join("")}
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="font-display text-sm italic">est. 2024</div>
      </div>
    </div>
  );
}
