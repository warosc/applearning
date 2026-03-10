'use client';

import { useState } from 'react';

type CalcOp = '+' | '-' | '×' | '÷' | '%' | null;

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<string | null>(null);
  const [op, setOp] = useState<CalcOp>(null);
  const [fresh, setFresh] = useState(false);

  function input(v: string) {
    if (fresh) { setDisplay(v === '.' ? '0.' : v); setFresh(false); return; }
    if (v === '.' && display.includes('.')) return;
    setDisplay(display === '0' && v !== '.' ? v : display + v);
  }

  function setOperator(o: CalcOp) {
    setPrev(display);
    setOp(o);
    setFresh(true);
  }

  function compute() {
    if (!op || prev === null) return;
    const a = parseFloat(prev), b = parseFloat(display);
    let r = 0;
    if (op === '+') r = a + b;
    else if (op === '-') r = a - b;
    else if (op === '×') r = a * b;
    else if (op === '÷') r = b !== 0 ? a / b : 0;
    else if (op === '%') r = a % b;
    const str = String(parseFloat(r.toFixed(10)));
    setDisplay(str);
    setPrev(null);
    setOp(null);
    setFresh(true);
  }

  function clear() { setDisplay('0'); setPrev(null); setOp(null); setFresh(false); }
  function toggle() { setDisplay(String(parseFloat(display) * -1)); }

  const btn = (label: string, action: () => void, variant: 'default' | 'op' | 'eq' | 'fn' = 'default') => {
    const base = 'h-10 w-full rounded-lg text-sm font-semibold transition-all active:scale-95 ';
    const variants = {
      default: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
      fn: 'bg-slate-200 hover:bg-slate-300 text-slate-700',
      op: op === label ? 'bg-blue-600 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700',
      eq: 'bg-blue-600 hover:bg-blue-700 text-white',
    };
    return (
      <button key={label} onClick={action} className={base + variants[variant]}>
        {label}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Display */}
      <div className="bg-slate-800 px-4 py-3 text-right">
        {op && prev && (
          <p className="text-xs text-slate-400 mb-0.5">{prev} {op}</p>
        )}
        <p className="text-2xl font-mono font-bold text-white truncate">{display}</p>
      </div>
      {/* Buttons */}
      <div className="p-2 grid grid-cols-4 gap-1.5">
        {btn('C', clear, 'fn')}
        {btn('±', toggle, 'fn')}
        {btn('%', () => setOperator('%'), 'fn')}
        {btn('÷', () => setOperator('÷'), 'op')}
        {['7', '8', '9'].map(n => btn(n, () => input(n)))}
        {btn('×', () => setOperator('×'), 'op')}
        {['4', '5', '6'].map(n => btn(n, () => input(n)))}
        {btn('-', () => setOperator('-'), 'op')}
        {['1', '2', '3'].map(n => btn(n, () => input(n)))}
        {btn('+', () => setOperator('+'), 'op')}
        {btn('0', () => input('0'))}
        {btn('.', () => input('.'))}
        {btn('⌫', () => setDisplay(display.length > 1 ? display.slice(0, -1) : '0'), 'fn')}
        {btn('=', compute, 'eq')}
      </div>
    </div>
  );
}
