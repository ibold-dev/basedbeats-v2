import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      value = 0,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const sliderRef = React.useRef<HTMLDivElement>(null);

    const percentage = ((value - min) / (max - min)) * 100;

    const handleMove = React.useCallback(
      (clientX: number) => {
        if (!sliderRef.current || disabled) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const percent = Math.max(
          0,
          Math.min(100, ((clientX - rect.left) / rect.width) * 100)
        );
        const newValue = min + ((max - min) * percent) / 100;
        const steppedValue = Math.round(newValue / step) * step;

        onChange?.(Math.max(min, Math.min(max, steppedValue)));
      },
      [min, max, step, onChange, disabled]
    );

    const handleMouseDown = (e: React.MouseEvent) => {
      if (disabled) return;
      setIsDragging(true);
      handleMove(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (disabled) return;
      setIsDragging(true);
      handleMove(e.touches[0].clientX);
    };

    React.useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) handleMove(e.clientX);
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (isDragging) handleMove(e.touches[0].clientX);
      };

      const handleEnd = () => setIsDragging(false);

      if (isDragging) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleEnd);
        document.addEventListener("touchmove", handleTouchMove);
        document.addEventListener("touchend", handleEnd);

        return () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleEnd);
          document.removeEventListener("touchmove", handleTouchMove);
          document.removeEventListener("touchend", handleEnd);
        };
      }
    }, [isDragging, handleMove]);

    return (
      <div
        ref={sliderRef}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        {...props}
      >
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <div
            className="absolute h-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div
          className="absolute block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
