
import * as React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("w-full px-4 mx-auto max-w-full", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Container.displayName = "Container"

export { Container }
