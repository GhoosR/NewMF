import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Event } from '../../../types/events';

interface CalendarViewProps {
  events: Event[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function CalendarView({ events, currentDate, onDateChange }: CalendarViewProps) {
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const weeks = Math.ceil((daysInMonth + firstDayOfMonth) / 7);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const getDayEvents = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const renderDay = (dayIndex: number, weekIndex: number) => {
    const day = dayIndex - firstDayOfMonth + (weekIndex * 7) + 1;
    const isValidDay = day > 0 && day <= daysInMonth;
    const dayEvents = isValidDay ? getDayEvents(day) : [];
    const isToday = new Date().toDateString() === 
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

    return (
      <div
        key={dayIndex}
        className={`min-h-24 p-2 border-accent-text/10 border ${
          isValidDay ? 'bg-background' : 'bg-accent-base/20'
        }`}
      >
        {isValidDay && (
          <>
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
              isToday ? 'bg-accent-text text-white' : ''
            }`}>
              {day}
            </span>
            <div className="mt-1 space-y-1">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="text-xs p-1 rounded bg-accent-base text-accent-text truncate"
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-background rounded-lg shadow">
      <div className="p-4 flex items-center justify-between border-b border-accent-text/10">
        <h2 className="text-lg font-semibold text-content">
          {monthName} {currentDate.getFullYear()}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-1 rounded hover:bg-accent-base"
          >
            <ChevronLeft className="h-5 w-5 text-content" />
          </button>
          <button
            onClick={() => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-1 rounded hover:bg-accent-base"
          >
            <ChevronRight className="h-5 w-5 text-content" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-2 text-sm font-medium text-content text-center border-b border-accent-text/10"
          >
            {day}
          </div>
        ))}
        
        {Array.from({ length: weeks }).map((_, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {Array.from({ length: 7 }).map((_, dayIndex) =>
              renderDay(dayIndex, weekIndex)
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}