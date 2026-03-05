export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <span className={`font-bold ${sizes[size]} tracking-tight`}>
      <span className="text-white">Zoom</span>
      <span className="gradient-text">Mate</span>
    </span>
  );
}
