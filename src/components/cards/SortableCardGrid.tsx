"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Item } from "@/lib/types";
import { ItemCard, CardDragHandle } from "@/components/cards/ItemCard";
import { itemsRepo } from "@/lib/db/repo";

export function SortableCardGrid({ items }: { items: Item[] }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const [order, setOrder] = useState(() => items.map((i) => i.id));

  // Re-sync when items list shape changes externally
  if (order.length !== items.length || order.some((id, i) => id !== items[i]?.id)) {
    setOrder(items.map((i) => i.id));
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    const updates = next.map((id, idx) => ({ id, sortOrder: items.length - idx }));
    await itemsRepo.reorder(updates);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
          {order.map((id) => {
            const item = items.find((i) => i.id === id);
            if (!item) return null;
            return <SortableItemCard key={id} item={item} />;
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItemCard({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <ItemCard
        item={item}
        disableTilt
        dragHandle={
          <CardDragHandle {...attributes} {...listeners} />
        }
      />
    </div>
  );
}
