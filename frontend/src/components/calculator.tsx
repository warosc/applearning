'use client';

import { useState } from 'react';

type CalcOp = '+' | '-' | '×' | '÷' | 'xʸ' | null;

const DEG = Math.PI / 180;

function fmt(n: number): string {
  if (!isFinite(n)) return 'Error';
  return String(parseFloat(n.toFixed(10)));
}

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<string | null>(null);
  const [op, setOp] = useState<CalcOp>(null);
  const [fresh, setFresh] = useState(false);
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');

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
    else if (op === '÷') r = b !== 0 ? a / b : NaN;
    else if (op === 'xʸ') r = Math.pow(a, b);
    setDisplay(fmt(r));
    setPrev(null);
    setOp(null);
    setFresh(true);
  }

  function unary(fn: (x: number) => number) {
    const x = parseFloat(display);
    setDisplay(fmt(fn(x)));
    setFresh(true);
  }

  function toAngle(deg: number) { return angleMode === 'deg' ? deg * DEG : deg; }

  function clear() { setDisplay('0'); setPrev(null); setOp(null); setFresh(false); }
  function toggle() { setDisplay(String(parseFloat(display) * -1)); }
  function backspace() { setDisplay(display.length > 1 ? display.slice(0, -1) : '0'); }

  // ── Button factory ────────────────────────────────────────────────────────
  type Variant = 'num' | 'op' | 'eq' | 'fn' | 'sci';

  function Btn({ label, onClick, variant = 'num', active = false, wide = false }: {
    label: React.ReactNode;
    onClick: () => void;
    variant?: Variant;
    active?: boolean;
    wide?: boolean;
  }) {
    const base = `h-11 rounded-xl text-sm font-bold transition-all active:scale-95 select-none cursor-pointer flex items-center justify-center ${wide ? 'col-span-2' : ''}`;
    const styles: Record<Variant, string> = {
      num: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
      fn:  'bg-slate-200 hover:bg-slate-300 text-slate-600',
      sci: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200',
      op:  active
            ? 'bg-blue-600 text-white shadow-inner'
            : 'bg-blue-100 hover:bg-blue-200 text-blue-700',
      eq:  'bg-blue-600 hover:bg-blue-700 text-white shadow',
    };
    return (
      <button onClick={onClick} className={`${base} ${styles[variant]}`}>
        {label}
      </button>
    );
  }

  const isActiveOp = (o: CalcOp) => op === o;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md w-64 select-none">

      {/* ── Display ── */}
      <div className="bg-slate-800 px-4 pt-3 pb-2">
        {op && prev && (
          <p className="text-xs text-slate-400 text-right truncate">{prev} {op}</p>
        )}
        <p className="text-3xl font-mono font-bold text-white text-right truncate leading-tight">
          {display}
        </p>
        {/* Angle mode toggle */}
        <div className="flex justify-end mt-1">
          <button
            onClick={() => setAngleMode(m => m === 'deg' ? 'rad' : 'deg')}
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            {angleMode.toUpperCase()}
          </button>
        </div>
      </div>

      {/* ── Buttons ── */}
      <div className="p-2 grid grid-cols-5 gap-1.5">

        {/* Row 1 — fn + trig */}
        <Btn label="⌫"   onClick={backspace}                         variant="fn" />
        <Btn label="C"   onClick={clear}                             variant="fn" />
        <Btn label="±"   onClick={toggle}                            variant="fn" />
        <Btn label="sen" onClick={() => unary(x => Math.sin(toAngle(x)))} variant="sci" />
        <Btn label="cos" onClick={() => unary(x => Math.cos(toAngle(x)))} variant="sci" />

        {/* Row 2 */}
        <Btn label="7" onClick={() => input('7')} />
        <Btn label="8" onClick={() => input('8')} />
        <Btn label="9" onClick={() => input('9')} />
        <Btn label="÷"   onClick={() => setOperator('÷')}  variant="op" active={isActiveOp('÷')} />
        <Btn label="tan" onClick={() => unary(x => Math.tan(toAngle(x)))} variant="sci" />

        {/* Row 3 */}
        <Btn label="4" onClick={() => input('4')} />
        <Btn label="5" onClick={() => input('5')} />
        <Btn label="6" onClick={() => input('6')} />
        <Btn label="×"   onClick={() => setOperator('×')}  variant="op" active={isActiveOp('×')} />
        <Btn label="√"   onClick={() => unary(x => Math.sqrt(x))} variant="sci" />

        {/* Row 4 */}
        <Btn label="1" onClick={() => input('1')} />
        <Btn label="2" onClick={() => input('2')} />
        <Btn label="3" onClick={() => input('3')} />
        <Btn label="−"   onClick={() => setOperator('-')}  variant="op" active={isActiveOp('-')} />
        <Btn label="xʸ"  onClick={() => setOperator('xʸ')} variant="sci" active={isActiveOp('xʸ')} />

        {/* Row 5 */}
        <Btn label="0"   onClick={() => input('0')} />
        <Btn label="."   onClick={() => input('.')} />
        <Btn label="Exp" onClick={() => unary(x => Math.exp(x))} variant="sci" />
        <Btn label="log" onClick={() => unary(x => Math.log10(x))} variant="sci" />
        <Btn label="="   onClick={compute} variant="eq" />

        {/* Row 6 — extra helpers */}
        <Btn label="π"   onClick={() => { setDisplay(fmt(Math.PI)); setFresh(true); }} variant="sci" />
        <Btn label="e"   onClick={() => { setDisplay(fmt(Math.E)); setFresh(true); }}  variant="sci" />
        <Btn label="ln"  onClick={() => unary(x => Math.log(x))} variant="sci" />
        <Btn label="x²"  onClick={() => unary(x => x * x)} variant="sci" />
        <Btn label="+"   onClick={() => setOperator('+')}  variant="op" active={isActiveOp('+')} />
      </div>
    </div>
  );
}
