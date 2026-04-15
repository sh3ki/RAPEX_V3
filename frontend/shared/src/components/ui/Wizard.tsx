'use client';

import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (index: number) => void;
  children: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  onSubmit?: () => void;
  submitting?: boolean;
}

export function Wizard({
  steps,
  currentStep,
  onStepChange,
  children,
  onNext,
  onPrevious,
  onSubmit,
  submitting = false,
}: WizardProps) {
  const isLastStep = currentStep >= steps.length - 1;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <ol className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const active = index === currentStep;
          const done = index < currentStep;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onStepChange(index)}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-colors',
                  active
                    ? 'border-primary-500 bg-primary-50'
                    : done
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50',
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Step {index + 1}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{step.title}</p>
                {step.description ? <p className="mt-1 text-xs text-gray-500">{step.description}</p> : null}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">{children}</div>

      <div className="mt-5 flex items-center justify-between">
        <Button type="button" variant="secondary" onClick={onPrevious} disabled={currentStep === 0}>
          Previous
        </Button>
        {isLastStep ? (
          <Button type="button" onClick={onSubmit} loading={submitting}>
            Submit
          </Button>
        ) : (
          <Button type="button" onClick={onNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
