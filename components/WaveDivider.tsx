export default function WaveDivider() {
  return (
    <div
      className="relative w-full overflow-hidden leading-none pointer-events-none select-none"
      aria-hidden="true"
    >
      <svg
        className="w-full h-[70px] md:h-[130px]"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back layer: faint blue, biggest bumps */}
        <path
          d="M0,80 C240,140 480,20 720,60 C960,100 1200,20 1440,70 L1440,140 L0,140 Z"
          fill="#89abe3"
          opacity="0.25"
        />
        {/* Middle layer: light cream, offset bumps for depth */}
        <path
          d="M0,100 C240,60 480,140 720,90 C960,40 1200,120 1440,90 L1440,140 L0,140 Z"
          fill="#e9e8e8"
          opacity="0.5"
        />
        {/* Front layer: solid, matches the section below so it blends seamlessly */}
        <path
          d="M0,120 C240,90 480,140 720,110 C960,80 1200,140 1440,110 L1440,140 L0,140 Z"
          fill="var(--background)"
        />
      </svg>
    </div>
  );
}
