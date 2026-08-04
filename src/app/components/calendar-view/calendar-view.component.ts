import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface ICalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'milestone' | 'due-date' | 'reminder';
  projectId: number;
  projectName: string;
  description: string;
  state?: string;
  status?: string;
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.css'],
})
export class CalendarViewComponent {
  @Input() events: ICalendarEvent[] = [];

  readonly currentDateSignal = signal(new Date());
  readonly currentDate = this.currentDateSignal.asReadonly();
  readonly currentMonth = computed(() => this.currentDate().getMonth());
  readonly currentYear = computed(() => this.currentDate().getFullYear());

  // Track which date cell is expanded
  readonly expandedDateSignal = signal<Date | null>(null);
  readonly expandedDate = this.expandedDateSignal.asReadonly();

  isDateExpanded(date: Date): boolean {
    const expanded = this.expandedDate();
    if (!expanded) return false;
    return (
      date.getDate() === expanded.getDate() &&
      date.getMonth() === expanded.getMonth() &&
      date.getFullYear() === expanded.getFullYear()
    );
  }

  toggleDateExpansion(date: Date): void {
    if (this.isDateExpanded(date)) {
      this.expandedDateSignal.set(null);
    } else {
      this.expandedDateSignal.set(date);
    }
  }

  onMoreMouseEnter(date: Date): void {
    this.expandedDateSignal.set(date);
  }

  onMoreMouseLeave(): void {
    // Small delay before collapsing to allow moving to expanded content
    setTimeout(() => {
      this.expandedDateSignal.set(null);
    }, 200);
  }

  readonly calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{
      date: Date;
      day: number;
      isCurrentMonth: boolean;
      events: ICalendarEvent[];
    }> = [];

    // Add previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: false,
        events: this.getEventsForDate(date),
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        day,
        isCurrentMonth: true,
        events: this.getEventsForDate(date),
      });
    }

    // Add next month's leading days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: false,
        events: this.getEventsForDate(date),
      });
    }

    return days;
  });

  readonly monthName = computed(() => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return monthNames[this.currentMonth()];
  });

  getEventsForDate(date: Date): ICalendarEvent[] {
    return this.events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  getEventTypeColor(type: string): string {
    switch (type) {
      case 'milestone':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'due-date':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'reminder':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }

  previousMonth(): void {
    const current = this.currentDateSignal();
    const newDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    this.currentDateSignal.set(newDate);
  }

  nextMonth(): void {
    const current = this.currentDateSignal();
    const newDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    this.currentDateSignal.set(newDate);
  }

  goToToday(): void {
    this.currentDateSignal.set(new Date());
  }

  onEventClick(event: ICalendarEvent, e: Event): void {
    e.stopPropagation();
    // Navigation will be handled by routerLink
  }
}
