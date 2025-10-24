import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md [animation-duration:0.25s]", className)}
      {...props}
    />
  )
}

export { Skeleton }
