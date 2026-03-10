'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  id: string;
  label: string;
  value: string;
  orderIndex?: number;
}

interface QuestionDragDropProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
}

function SortableItem({ id, label }: { id: string; label: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-white p-3',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab text-slate-400 hover:text-slate-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span>{label}</span>
    </div>
  );
}

const defaultOrder = (opts: Option[]) =>
  [...opts].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).map((o) => o.value);

export function QuestionDragDrop({ options, value, onChange }: QuestionDragDropProps) {
  const [items, setItems] = useState<string[]>(() =>
    value.length > 0 ? value : defaultOrder(options)
  );

  useEffect(() => {
    if (value.length > 0) setItems(value);
    else setItems(defaultOrder(options));
  }, [options, value]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      const next = arrayMove(prev, oldIndex, newIndex);
      onChange(next);
      return next;
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          <p className="text-sm text-slate-600">Arrastra para ordenar (de arriba a abajo)</p>
          {items.map((val) => {
            const opt = options.find((o) => o.value === val);
            return opt ? (
              <SortableItem key={opt.value} id={opt.value} label={opt.label} />
            ) : null;
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
