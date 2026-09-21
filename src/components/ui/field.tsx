import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

interface FieldWrapProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

function FieldWrap({ id, label, hint, error, required, children }: FieldWrapProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          {required ? <span className="text-ayli-peach"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint && !error ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const FIELD_CLASSES =
  "h-12 w-full rounded-card border border-hairline bg-warm-white px-4 text-[15px] text-ink placeholder:text-muted/70 transition-colors focus:border-ayli-blue focus:outline-none aria-[invalid=true]:border-danger";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, required, className, ...props }: InputProps) {
  const id = useId();
  return (
    <FieldWrap id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        required={required}
        className={cn(FIELD_CLASSES, className)}
        {...props}
      />
    </FieldWrap>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Select({ label, hint, error, required, className, children, ...props }: SelectProps) {
  const id = useId();
  return (
    <FieldWrap id={id} label={label} hint={hint} error={error} required={required}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        required={required}
        className={cn(FIELD_CLASSES, "appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
    </FieldWrap>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, required, className, ...props }: TextareaProps) {
  const id = useId();
  return (
    <FieldWrap id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        required={required}
        className={cn(FIELD_CLASSES, "h-auto min-h-28 py-3", className)}
        {...props}
      />
    </FieldWrap>
  );
}