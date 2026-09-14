export type HourSlot = {
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
};

export function hoursOverlap(
  left: Pick<HourSlot, "startTime" | "endTime">,
  right: Pick<HourSlot, "startTime" | "endTime">,
) {
  return left.startTime < right.endTime && left.endTime > right.startTime;
}

export function hasSameDayOverlap(slots: HourSlot[]) {
  const byDay = new Map<number | undefined, HourSlot[]>();
  for (const slot of slots) {
    const group = byDay.get(slot.dayOfWeek) ?? [];
    group.push(slot);
    byDay.set(slot.dayOfWeek, group);
  }

  return [...byDay.values()].some((daySlots) => {
    const ordered = [...daySlots].sort((left, right) =>
      left.startTime.localeCompare(right.startTime),
    );
    return ordered.some(
      (slot, index) => index > 0 && hoursOverlap(ordered[index - 1], slot),
    );
  });
}
