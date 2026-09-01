import { CardHeader as PrimitiveCardHeader } from "@radix-ui/react-card";
import { CardContent as PrimitiveCardContent } from "@radix-ui/react-card";
import { CardFooter as PrimitiveCardFooter } from "@radix-ui/react-card";
import { CardTitle as PrimitiveCardTitle } from "@radix-ui/react-card";
import * as React from "react";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div className={"rounded-xl border bg-card text-card-foreground shadow-sm " + (className || "")} ref={ref>
    <div className="divide-y">{props.children}</div>
  </div>
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(
  ({ className, ...props }, ref) => (
    <PrimitiveCardHeader.ref={ref} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardContent = React.forwardRef(
  ({ className, ...props }, ref) => (
    <PrimitiveCardContent.ref={ref} className={"pb-4 pt-0 " + (className || "")} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(
  ({ className, ...props }, ref) => (
    <PrimitiveCardFooter.ref={ref} className={"pt-0 pb-4 " + (className || "")} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

const CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => (
    <PrimitiveCardTitle.ref={ref} className={"text-lg leading-none tracking-tight " + (className || "")} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

export { Card, CardHeader, CardContent, CardFooter, CardTitle };