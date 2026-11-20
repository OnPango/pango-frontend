import {
  Fragment,
  useImperativeHandle,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type Ref,
} from 'react';
import { cn } from '@/shared/lib/cn';

export interface CodeInputHandle {
  /** Focuses the first empty box (the first one when all are filled). */
  focus: () => void;
}

interface CodeInputProps {
  /** One entry per box: a digit or `''`. Its length is the code's length. */
  value: string[];
  onChange: (value: string[]) => void;
  /** Called when the last empty box gets its digit, with the whole code. */
  onComplete?: (code: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  /** Name of the group for screen readers. */
  label: string;
  'aria-describedby'?: string;
  ref?: Ref<CodeInputHandle>;
  className?: string;
}

const digitsOf = (text: string) => text.replace(/\D/g, '');

/**
 * A numeric one-time code, one round box per digit. Typing moves forward, Backspace moves back, the
 * arrows move between boxes, and pasting or the browser's code autofill (the first box asks for
 * `one-time-code`) fills them all at once.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  invalid = false,
  disabled = false,
  label,
  ref,
  className,
  ...aria
}: CodeInputProps) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const length = value.length;
  const half = length >= 6 && length % 2 === 0 ? length / 2 : null;

  const focusBox = (index: number) => {
    const box = boxes.current[Math.max(0, Math.min(index, length - 1))];
    box?.focus();
    box?.select();
  };

  useImperativeHandle(ref, () => ({
    focus: () => {
      const empty = value.indexOf('');
      focusBox(empty === -1 ? 0 : empty);
    },
  }));

  /** Writes `digits` from box `start` on and moves to the box after the last one written. */
  const fill = (start: number, digits: string) => {
    const next = [...value];
    const written = digits.slice(0, length - start);
    for (let i = 0; i < written.length; i++) next[start + i] = written[i];
    onChange(next);
    focusBox(start + written.length);
    const wasComplete = value.every(Boolean);
    if (!wasComplete && next.every(Boolean)) onComplete?.(next.join(''));
  };

  const handleInput = (index: number, raw: string) => {
    const digits = digitsOf(raw);
    if (!digits) {
      if (raw === '') onChange(value.map((d, i) => (i === index ? '' : d)));
      return;
    }
    // A whole code (autofill, or pasted where the paste event was not seen) fills from the start.
    fill(digits.length >= length ? 0 : index, digits.length >= length ? digits : digits.at(-1)!);
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    const digits = digitsOf(event.clipboardData.getData('text'));
    event.preventDefault();
    if (!digits) return;
    fill(digits.length >= length ? 0 : index, digits);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !value[index] && index > 0) {
      event.preventDefault();
      onChange(value.map((d, i) => (i === index - 1 ? '' : d)));
      focusBox(index - 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={aria['aria-describedby']}
      className={cn('flex w-full items-center justify-center gap-1.5 sm:gap-2', className)}
    >
      {value.map((digit, index) => (
        <Fragment key={index}>
          {half !== null && index === half && (
            <span aria-hidden className="h-0.5 w-2.5 shrink-0 rounded-full bg-primary/40" />
          )}
          <input
            ref={(node) => {
              boxes.current[index] = node;
            }}
            value={digit}
            onChange={(event) => handleInput(index, event.target.value)}
            onPaste={(event) => handlePaste(index, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onFocus={(event) => event.target.select()}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            disabled={disabled}
            aria-label={`Dígito ${index + 1} de ${length}`}
            aria-invalid={invalid || undefined}
            className={cn(
              'aspect-square min-w-0 flex-1 basis-0 rounded-[42%] border-2 bg-transparent text-center text-xl font-semibold text-fg tabular-nums caret-primary transition-[border-color,box-shadow,transform] outline-none sm:max-w-13',
              'focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
              invalid
                ? 'border-danger focus:ring-danger/20'
                : digit
                  ? 'border-primary focus:ring-primary/20'
                  : 'border-primary/40 hover:border-primary/70 focus:border-primary focus:ring-primary/20',
            )}
          />
        </Fragment>
      ))}
    </div>
  );
}
