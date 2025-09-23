import { format, parseISO } from 'date-fns';

export function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A';
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!parsedDate || isNaN(parsedDate.getTime())) return 'N/A';
    
    return format(parsedDate, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

export function formatTime(date: Date | string | null): string {
  if (!date) return 'N/A';
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!parsedDate || isNaN(parsedDate.getTime())) return 'N/A';
    
    return format(parsedDate, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'N/A';
  }
}