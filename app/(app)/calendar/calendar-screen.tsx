'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { dateKey } from '@/lib/format';
import { CALENDAR_TYPES, type CalendarEvent } from '@/lib/calendar';

const MONTH_NAMES = ['JANUAR', 'FEBRUAR', 'MÄRZ', 'APRIL', 'MAI', 'JUNI', 'JULI', 'AUGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DEZEMBER'];
const WEEKDAY_HEADERS = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];
const COLOR_BY_TYPE = Object.fromEntries(CALENDAR_TYPES.map((t) => [t.type, t.color]));

export function CalendarScreen({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const todayKey = dateKey(today);
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      (map[event.date] ??= []).push(event);
    }
    return map;
  }, [events]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const trailingBlanks = (7 - ((leadingBlanks + daysInMonth) % 7)) % 7;

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setViewMonth(next);
    setSelectedDate(dateKey(next));
  };

  const selectedEvents = (eventsByDate[selectedDate] ?? []).slice().sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

  return (
    <>
      <div className="cal-nav">
        <button type="button" onClick={() => changeMonth(-1)} aria-label="Vorheriger Monat">‹</button>
        <strong>{MONTH_NAMES[month]} {year}</strong>
        <button type="button" onClick={() => changeMonth(1)} aria-label="Nächster Monat">›</button>
      </div>

      <div className="cal-weekdays">
        {WEEKDAY_HEADERS.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="cal-grid">
        {Array.from({ length: leadingBlanks }).map((_, i) => <div className="cal-cell empty" key={`lead-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = dateKey(new Date(year, month, day));
          const dayEvents = eventsByDate[key] ?? [];
          const types = CALENDAR_TYPES.filter((t) => dayEvents.some((e) => e.type === t.type));
          return (
            <button
              type="button"
              key={key}
              className={`cal-cell${key === todayKey ? ' today' : ''}${key === selectedDate ? ' selected' : ''}`}
              onClick={() => setSelectedDate(key)}
            >
              <span>{day}</span>
              {types.length > 0 && (
                <div className="cal-dots">
                  {types.map((t) => <i key={t.type} style={{ background: t.color }} />)}
                </div>
              )}
            </button>
          );
        })}
        {Array.from({ length: trailingBlanks }).map((_, i) => <div className="cal-cell empty" key={`trail-${i}`} />)}
      </div>

      <div className="cal-legend">
        {CALENDAR_TYPES.map((t) => (
          <span key={t.type} className="cal-legend-item"><i style={{ background: t.color }} />{t.label}</span>
        ))}
      </div>

      <section>
        <div className="row section-heading"><span className="label">{selectedDate === todayKey ? 'HEUTE' : selectedDate.split('-').reverse().join('.')}</span></div>
        {selectedEvents.length === 0 ? (
          <p className="empty-state">Keine Termine an diesem Tag.</p>
        ) : (
          selectedEvents.map((event, i) => (
            <Link href={event.link} className={`cal-event-row${event.dim ? ' dim' : ''}`} key={`${event.type}-${i}`}>
              <i style={{ background: COLOR_BY_TYPE[event.type] }} />
              <div className="grow">
                <strong>{event.label}</strong>
                <span className="gig-row-time">{event.time ? event.time.slice(0, 5) : ''}</span>
              </div>
            </Link>
          ))
        )}
      </section>
    </>
  );
}
