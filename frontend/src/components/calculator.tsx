'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Operator = '+' | '-' | '×' | '÷' | '%';

function applyOperator(a: number, b: number, op: Operator): number | null {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? null : a / b;
    case '%':
      return a % b;
    default:
      return null;
  }
}

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [pendingOp, setPendingOp] = useState<Operator | null>(null);
  const [prevValue, setPrevValue] = useState<number | null>(null);

  const handleInput = useCallback(
    (key: string) => {
      if (key === 'C') {
        setDisplay('0');
        setPendingOp(null);
        setPrevValue(null);
        return;
      }
      if (key === '±') {
        setDisplay((d) => (d.startsWith('-') ? d.slice(1) : d === '0' ? '0' : '-' + d));
        return;
      }
      if (key === '=') {
        if (pendingOp && prevValue !== null) {
          const current = parseFloat(display.replace(',', '.'));
          if (!Number.isNaN(current)) {
            const result = applyOperator(prevValue, current, pendingOp);
            if (result !== null) {
              setDisplay(String(result));
              setPendingOp(null);
              setPrevValue(null);
            }
          }
        }
        return;
      }
      if (['+', '-', '×', '÷', '%'].includes(key)) {
        const current = parseFloat(display.replace(',', '.'));
        if (!Number.isNaN(current)) {
          if (pendingOp && prevValue !== null) {
            const result = applyOperator(prevValue, current, pendingOp);
            if (result !== null) {
              setDisplay(String(result));
              setPrevValue(result);
            }
          } else {
            setPrevValue(current);
          }
          setPendingOp(key as Operator);
        }
        return;
      }
      if (key === '.') {
        if (!display.includes('.')) setDisplay((d) => d + '.');
        return;
      }
      setDisplay((d) => (d === '0' && key !== '.' ? key : d + key));
    },
    [pendingOp, prevValue, display]
  );

  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <div className="mb-2 text-right font-mono text-2xl font-medium tabular-nums">
        {display}
      </div>
      <div className="space-y-1">
        {BUTTONS.map((row, i) => (
          <div
            key={i}
            className="grid gap-1"
            style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
          >
            {row.map((k) => (
              <Button
                key={k}
                variant="secondary"
                size="sm"
                className={cn('font-mono', k === '0' && 'col-span-2')}
                onClick={() => handleInput(k)}
              >
                {k}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
