import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatButton {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "secondary";
}

interface FloatButtonsProps {
  buttons: FloatButton[];
  className?: string;
}

export function FloatButtons({ buttons, className }: FloatButtonsProps) {
  return (
    <div className={cn("fixed bottom-6 right-6 z-50 flex flex-col gap-3", className)}>
      {buttons.map((button, index) => (
        <Button
          key={index}
          size="lg"
          variant={button.variant || "default"}
          onClick={button.onClick}
          className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
          aria-label={button.label}
        >
          {button.icon}
        </Button>
      ))}
    </div>
  );
}