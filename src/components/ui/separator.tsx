/**
 * Separator UI 컴포넌트
 * 
 * 구분선을 표시하는 컴포넌트입니다.
 * 수평 또는 수직 방향으로 콘텐츠를 시각적으로 구분합니다.
 */

"use client"
 
import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
 
import { cn } from "@/lib/utils"
 
/**
 * Separator 컴포넌트
 * 
 * Radix UI의 Separator 컴포넌트를 기반으로 한 구분선 컴포넌트입니다.
 * 수평 또는 수직 방향을 지정할 수 있으며 다양한 스타일 속성을 적용할 수 있습니다.
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName
 
export { Separator } 