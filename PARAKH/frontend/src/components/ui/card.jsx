import * as React from "react";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div className={"rounded-xl border bg-card text-card-foreground shadow-sm " + (className || "")} ref={ref}>
    <div className="divide-y">{props.children}</div>
  </div>
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={"border-b " + (className || "")} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

const CardContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={"pb-4 pt-0 " + (className || "")} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={"pt-0 pb-4 " + (className || "")} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";

const CardTitle = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={"text-lg leading-none tracking-tight " + (className || "")} {...props}>
      {children}
    </div>
  )
);
CardTitle.displayName = "CardTitle";

export { Card, CardHeader, CardContent, CardFooter, CardTitle };