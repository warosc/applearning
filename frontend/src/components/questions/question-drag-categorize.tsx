'use client';

import { useRef, useState } from 'react';

/**
 * drag_categorize — Classify items into categories (drag & drop or tap)
 *
 * metadata_json:
 *   categories: [{id: "cat_0", label: "SÍ son ETS"}, {id: "cat_1", label: "NO son ETS"}]
 *   correct_map: {"vih": "cat_0", "difteria": "cat_1", ...}  (hidden from students)
 *
 * options: [{value: "vih", label: "VIH"}, ...]  — the draggable items
 *
 * answer: {"vih": "cat_0", "difteria": "cat_1", ...}
 */

interface Category {
  id: string;
  label: string;
}

interface Item {
  value: string;
  label: string;
  image_url?: string | null;
}

interface QuestionDragCategorizeProps {
  question: {
    options?: Item[];
    metadata_json?: {
      categories?: Category[];
      correct_map?: Record<string, string>;
    } | null;
  };
  answer: unknown;
  onAnswer: (value: unknown) => void;
}

export function QuestionDragCategorize({ question, answer, onAnswer }: QuestionDragCategorizeProps) {
  const categories: Category[] = question.metadata_json?.categories ?? [];
  const items: Item[] = question.options ?? [];

  const current: Record<string, string> =
    answer && typeof answer === 'object' && !Array.isArray(answer)
      ? (answer as Record<string, string>)
      : {};

  // Items not yet placed in any category
  const pool = items.filter((item) => !current[item.value]);
  // Items per category
  const inCategory = (catId: string) => items.filter((item) => current[item.value] === catId);

  // ── Drag state ──
  const draggingRef = useRef<string | null>(null); // item.value being dragged
  const [draggingOver, setDraggingOver] = useState<string | null>(null); // cat id or "pool"

  // ── Touch / click fallback ──
  const [selected, setSelected] = useState<string | null>(null); // item value picked by tap

  function place(itemValue: string, catId: string | null) {
    const updated = { ...current };
    if (catId === null) {
      delete updated[itemValue];
    } else {
      updated[itemValue] = catId;
    }
    onAnswer(Object.keys(updated).length ? updated : null);
  }

  // ── Drag handlers ──
  function onDragStart(itemValue: string) {
    draggingRef.current = itemValue;
    setSelected(null);
  }

  function onDrop(catId: string | null) {
    if (draggingRef.current) {
      place(draggingRef.current, catId);
      draggingRef.current = null;
    }
    setDraggingOver(null);
  }

  // ── Tap/click handlers ──
  function onItemTap(itemValue: string) {
    if (selected === itemValue) {
      setSelected(null); // deselect
    } else {
      setSelected(itemValue);
    }
  }

  function onCategoryTap(catId: string) {
    if (selected) {
      place(selected, catId);
      setSelected(null);
    }
  }

  function onPoolTap() {
    // if tapping pool while something selected, return it
    if (selected && current[selected]) {
      place(selected, null);
      setSelected(null);
    }
  }

  const totalPlaced = Object.keys(current).length;

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
        Arrastra cada elemento a su categoría (o tócalo y luego toca la categoría)
      </p>

      {/* ── Item pool ── */}
      <div
        className={`min-h-[64px] rounded-xl border-2 border-dashed p-3 transition-colors ${
          draggingOver === 'pool'
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDraggingOver('pool'); }}
        onDragLeave={() => setDraggingOver(null)}
        onDrop={() => onDrop(null)}
        onClick={onPoolTap}
      >
        {pool.length === 0 && (
          <p className="text-xs text-gray-400 italic text-center py-1">
            {totalPlaced === items.length ? 'Todos los elementos han sido clasificados' : 'Arrastra aquí para devolver un elemento'}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {pool.map((item) => (
            <DraggableItem
              key={item.value}
              item={item}
              isSelected={selected === item.value}
              onDragStart={() => onDragStart(item.value)}
              onTap={() => onItemTap(item.value)}
            />
          ))}
        </div>
      </div>

      {/* ── Category columns ── */}
      <div className={`grid gap-3 ${categories.length === 1 ? 'grid-cols-1' : categories.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {categories.map((cat) => {
          const catItems = inCategory(cat.id);
          const isOver = draggingOver === cat.id;

          return (
            <div
              key={cat.id}
              className={`rounded-xl border-2 overflow-hidden transition-colors ${
                isOver
                  ? 'border-blue-500 bg-blue-50'
                  : selected
                    ? 'border-blue-300 bg-blue-50/40 cursor-pointer'
                    : 'border-gray-200 bg-white'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDraggingOver(cat.id); }}
              onDragLeave={() => setDraggingOver(null)}
              onDrop={() => onDrop(cat.id)}
              onClick={() => onCategoryTap(cat.id)}
            >
              {/* Category header */}
              <div className="bg-gray-800 text-white text-center px-3 py-2.5">
                <p className="text-xs font-bold uppercase tracking-wide leading-tight">{cat.label}</p>
              </div>

              {/* Dropped items */}
              <div className="p-2 min-h-[80px] flex flex-col gap-1.5">
                {selected && (
                  <p className="text-[10px] text-blue-500 text-center py-1 animate-pulse">
                    Toca para colocar aquí
                  </p>
                )}
                {catItems.map((item) => (
                  <DraggableItem
                    key={item.value}
                    item={item}
                    isSelected={selected === item.value}
                    placed
                    onDragStart={() => onDragStart(item.value)}
                    onTap={() => onItemTap(item.value)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <p className="text-xs text-gray-400 text-right">{totalPlaced} / {items.length} clasificados</p>
    </div>
  );
}

// ── Draggable item chip ───────────────────────────────────────────────────────

function DraggableItem({
  item,
  isSelected,
  placed = false,
  onDragStart,
  onTap,
}: {
  item: Item;
  isSelected: boolean;
  placed?: boolean;
  onDragStart: () => void;
  onTap: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={(e) => { e.stopPropagation(); onTap(); }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing select-none transition-all
        ${isSelected
          ? 'border-blue-500 bg-blue-100 shadow-md ring-2 ring-blue-300 scale-105'
          : placed
            ? 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
            : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50/40 shadow-sm'
        }
      `}
    >
      <span className="text-gray-400 text-xs select-none">⠿</span>
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt={item.label} className="h-8 w-8 object-contain rounded" />
      )}
      <span className="text-sm font-medium text-gray-800 leading-tight">{item.label}</span>
    </div>
  );
}
