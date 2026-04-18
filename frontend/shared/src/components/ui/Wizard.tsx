'use client';

import { Check, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
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
    <div className="rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
      <div className="border-b border-slate-200/80 px-4 py-6 sm:px-6">
        <ol className="flex items-start justify-between gap-2 overflow-x-auto pb-1">
          {steps.map((step, index) => {
            const active = index === currentStep;
            const done = index < currentStep;
            const upcoming = index > currentStep;

            return (
              <li key={step.id} className="min-w-[126px] flex-1">
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => onStepChange(index)}
                    className={cn(
                      'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
                      done
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : active
                        ? 'border-primary-500 bg-primary-500 text-white ring-4 ring-primary-100'
                        : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400',
                    )}
                    aria-label={step.title}
                  >
                    <span className="inline-flex h-full w-full items-center justify-center leading-none">
                      {done ? <Check size={16} /> : step.icon || index + 1}
                    </span>
                  </button>
                  {index < steps.length - 1 ? (
                    <span
                      className={cn(
                        'mx-3 h-[2px] flex-1 min-w-[36px] self-center',
                        done || active ? 'bg-primary-200' : 'bg-slate-200',
                      )}
                    />
                  ) : null}
                </div>
                <p
                  className={cn(
                    'mt-3 text-center text-sm font-medium',
                    active ? 'text-primary-700' : done ? 'text-slate-900' : upcoming ? 'text-slate-500' : 'text-slate-700',
                  )}
                >
                  {step.title}
                </p>
                {step.description ? <p className="mt-1 text-center text-xs text-slate-500">{step.description}</p> : null}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">{children}</div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/70 px-4 py-4 sm:px-6">
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
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
