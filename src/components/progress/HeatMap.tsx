'use client';

import { useMemo, useState } from 'react';

interface HeatMapProps {
  data: { date: string; count: number }[];
  days?: number;
}

const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];

function getColor(count: number): string {
  if (count === 0) return 'var(--muted)';
  if (count <= 10) return '#fce4ec';
  if (count <= 25) return '#f48fb1';
  return '#e91e63';
}

function getMonthLabel(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()];
}

export default function HeatMap({ data, days = 90 }: HeatMapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  const { grid, monthLabels } = useMemo(() => {
    // Create a lookup map from date string to count
    const countMap = new Map<string, number>();
    for (const item of data) {
      countMap.set(item.date, item.count);
    }

    // Build the grid: 7 rows (days of week), variable columns (weeks)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days + 1);

    // Adjust start to the previous Monday
    const dayOfWeek = startDate.getDay();
    const adjustedStart = new Date(startDate);
    adjustedStart.setDate(adjustedStart.getDate() - ((dayOfWeek + 6) % 7));

    const cells: { date: Date; count: number; row: number; col: number }[] = [];
    const labels: { label: string; col: number }[] = [];
    const seenMonths = new Set<string>();

    let currentDate = new Date(adjustedStart);
    let col = 0;

    while (currentDate <= today) {
      const weekStart = new Date(currentDate);

      for (let row = 0; row < 7; row++) {
        const cellDate = new Date(weekStart);
        cellDate.setDate(weekStart.getDate() + row);

        if (cellDate > today) break;

        const dateStr = cellDate.toISOString().split('T')[0];
        const count = countMap.get(dateStr) ?? 0;

        cells.push({ date: cellDate, count, row, col });

        // Month label for first day of month
        const monthKey = `${cellDate.getFullYear()}-${cellDate.getMonth()}`;
        if (cellDate.getDate() <= 7 && !seenMonths.has(monthKey)) {
          seenMonths.add(monthKey);
          labels.push({ label: getMonthLabel(cellDate), col });
        }
      }

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
      col++;
    }

    return { grid: cells, monthLabels: labels };
  }, [data, days]);

  const totalCols = Math.max(...grid.map((c) => c.col), 0) + 1;
  const cellSize = 14;
  const cellGap = 3;
  const labelWidth = 24;
  const topPadding = 20;
  const svgWidth = labelWidth + totalCols * (cellSize + cellGap);
  const svgHeight = topPadding + 7 * (cellSize + cellGap);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        className="min-w-fit"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Month labels */}
        {monthLabels.map((ml, i) => (
          <text
            key={i}
            x={labelWidth + ml.col * (cellSize + cellGap)}
            y={12}
            fontSize={10}
            fill="var(--muted-foreground)"
          >
            {ml.label}
          </text>
        ))}

        {/* Day labels */}
        {DAY_LABELS.map((label, i) =>
          label ? (
            <text
              key={i}
              x={0}
              y={topPadding + i * (cellSize + cellGap) + cellSize - 2}
              fontSize={10}
              fill="var(--muted-foreground)"
            >
              {label}
            </text>
          ) : null
        )}

        {/* Cells */}
        {grid.map((cell, i) => {
          const x = labelWidth + cell.col * (cellSize + cellGap);
          const y = topPadding + cell.row * (cellSize + cellGap);
          const dateStr = cell.date.toISOString().split('T')[0];

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              rx={3}
              fill={getColor(cell.count)}
              className="cursor-pointer transition-opacity hover:opacity-80"
              onMouseEnter={(e) => {
                const rect = (e.target as SVGRectElement).getBoundingClientRect();
                setTooltip({
                  date: dateStr,
                  count: cell.count,
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 5, 15, 30].map((count) => (
          <div
            key={count}
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: getColor(count) }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-border bg-card px-2 py-1 text-xs shadow-md"
          style={{
            left: tooltip.x,
            top: tooltip.y - 36,
            transform: 'translateX(-50%)',
          }}
        >
          <span className="font-medium">
            {new Date(tooltip.date + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          : {tooltip.count} review{tooltip.count !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
