import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TaskTypeIcon } from './TaskTypeIcon';

interface Task {
  id: string;
  title: string;
  date: string;
  task_type: string;
}

interface CalendarProps {
  tasks: Task[];
  onDateClick: (date: Date) => void;
}

export function Calendar({ tasks, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const getDayTasks = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return tasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
  };

  const renderDay = (dayIndex: number, weekIndex: number) => {
    const day = dayIndex - firstDayOfMonth + (weekIndex * 7) + 1;
    const isValidDay = day > 0 && day <= daysInMonth;
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayTasks = isValidDay ? getDayTasks(day) : [];
    const isCurrentDay = isToday(day);

    return (
      <div
        key={dayIndex}
        className={`min-h-24 p-2 border-accent-text/10 border ${
          isValidDay ? 'bg-white hover:bg-accent-base/5 cursor-pointer' : 'bg-gray-50'
        }`}
        onClick={() => isValidDay && onDateClick(dayDate)}
      >
        {isValidDay && (
          <>
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
              isCurrentDay ? 'bg-accent-text text-white' : ''
            }`}>
              {day}
            </span>
            <div className="mt-1 space-y-1">
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  className="text-xs p-1 rounded bg-accent-base/10 text-accent-text truncate flex items-center"
                  title={task.title}
                >
                  <TaskTypeIcon type={task.task_type} className="mr-1 flex-shrink-0" size={10} />
                  {task.title}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 flex items-center justify-between border-b border-accent-text/10">
        <h2 className="text-lg font-semibold text-content">
          {monthName} {currentDate.getFullYear()}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-1 rounded hover:bg-accent-base/10"
          >
            <ChevronLeft className="h-5 w-5 text-content" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-1 rounded hover:bg-accent-base/10"
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