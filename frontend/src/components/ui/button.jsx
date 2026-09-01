export default function Button({ variant = "default", children, ...props }) {
  const baseClasses = "rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

  const variantClasses = {
    default: `${baseClasses} bg-primary text-primary-foreground hover:bg-primary/90`,
    destructive: `${baseClasses} bg-destructive text-destructive-foreground hover:bg-destructive/90`,
    outline: `${baseClasses} border border-input hover:bg-accent hover:text-accent-foreground`,
    secondary: `${baseClasses} bg-secondary text-secondary-foreground hover:bg-secondary/80`,
    ghost: `${baseClasses} hover:bg-accent hover:text-accent-foreground`,
    link: `${baseClasses} underline-offset-4 hover:underline text-primary`,
  };

  return (
    <button className={`${variantClasses[variant] || variantClasses.default} ${props.className || ""}`} {...props}>
      {children}
    </button>
  );
}