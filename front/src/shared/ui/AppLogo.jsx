import { cn } from "../utils/cn";

export function AppLogo({ size = "md", className }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };

  return (
    <img
      src="/logo_mycad.png"
      alt="MyCAD Logo"
      className={cn(sizes[size], "object-contain", className)}
    />
  );
}
