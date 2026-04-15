'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function Calendar({ events }: CalendarProps) {
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => formatIsoDate(new Date()));

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prefixDays = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const cells: Array<{ date: Date; currentMonth: boolean }> = [];

    for (let i = prefixDays - 1; i >= 0; i -= 1) {
      const date = new Date(year, month, -i);
      cells.push({ date, currentMonth: false });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push({ date: new Date(year, month, day), currentMonth: true });
    }

    while (cells.length % 7 !== 0) {
      const date = new Date(year, month + 1, cells.length - (prefixDays + totalDays) + 1);
      cells.push({ date, currentMonth: false });
    }

    return cells;
  }, [month, year]);

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      if (!acc[event.date]) {
        acc[event.date] = [];
      }
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [events]);

  const selectedEvents = eventsByDate[selectedDate] ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            {monthCursor.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setMonthCursor(new Date(year, month - 1, 1))} className="rounded-md p-2 hover:bg-gray-100">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => setMonthCursor(new Date(year, month + 1, 1))} className="rounded-md p-2 hover:bg-gray-100">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="px-2 py-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
              {weekday}
            </div>
          ))}

          {days.map(({ date, currentMonth }) => {
            const iso = formatIsoDate(date);
            const dayEvents = eventsByDate[iso] ?? [];
            const selected = iso === selectedDate;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(iso)}
                className={`min-h-20 rounded-lg border px-2 py-1 text-left transition-colors ${
                  selected
                    ? 'border-primary-500 bg-primary-50'
                    : currentMonth
                    ? 'border-gray-100 bg-white hover:bg-gray-50'
                    : 'border-gray-100 bg-gray-50 text-gray-400'
                }`}
              >
                <p className="text-xs font-semibold">{date.getDate()}</p>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 2).map((eventItem) => (
                    <p key={eventItem.id} className="truncate rounded bg-primary-100 px-1.5 py-0.5 text-[10px] text-primary-700">
                      {eventItem.title}
                    </p>
                  ))}
                  {dayEvents.length > 2 ? <p className="text-[10px] text-gray-500">+{dayEvents.length - 2} more</p> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Events</h3>
        <p className="text-sm text-gray-500">{new Date(selectedDate).toDateString()}</p>

        <div className="mt-3 space-y-2">
          {selectedEvents.length ? (
            selectedEvents.map((eventItem) => (
              <article key={eventItem.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-900">{eventItem.title}</p>
                {eventItem.description ? <p className="mt-1 text-xs text-gray-500">{eventItem.description}</p> : null}
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500">No events on this date.</p>
          )}
        </div>
      </div>
    </div>
  );
}
