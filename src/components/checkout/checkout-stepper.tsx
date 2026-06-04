import { cn } from "@/lib/utils";

interface CheckoutStepperProps {
  currentStep: number;
}

const steps = ["Details", "Delivery", "Review", "Payment"];

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Checkout progress">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isComplete = stepNumber < currentStep;

        return (
          <li
            className={cn(
              "rounded-[var(--radius-sm)] border px-2 py-2 text-center text-xs font-bold",
              isActive || isComplete
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]",
            )}
            key={step}
          >
            <span className="block text-xs">Step {stepNumber}</span>
            {step}
          </li>
        );
      })}
    </ol>
  );
}
