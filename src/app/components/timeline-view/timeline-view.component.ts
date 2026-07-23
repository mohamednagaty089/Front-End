import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface IProjectTimeline {
  projectId: number;
  projectName: string;
  clientName: string;
  startDate: string;
  endDate: string | null;
  status: string;
  leadName: string;
  leadDepartment: string;
}

@Component({
  selector: 'app-timeline-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './timeline-view.component.html',
  styleUrls: ['./timeline-view.component.css'],
})
export class TimelineViewComponent {
  @Input() projects: IProjectTimeline[] = [];

  readonly sortedProjects = computed(() => {
    return [...this.projects].sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return dateA - dateB;
    });
  });

  readonly dateRange = computed(() => {
    if (this.projects.length === 0) {
      return { min: new Date(), max: new Date() };
    }

    const dates = this.projects
      .map((p) => [
        new Date(p.startDate),
        p.endDate ? new Date(p.endDate) : new Date(),
      ])
      .flat();

    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));

    return { min, max };
  });

  getProjectDuration(project: IProjectTimeline): number {
    const start = new Date(project.startDate);
    const end = project.endDate
      ? new Date(project.endDate)
      : new Date();
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDurationDisplay(project: IProjectTimeline): string {
    const start = new Date(project.startDate);
    const now = new Date();
    // Reset time to midnight for accurate day comparison
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // If project hasn't started yet (start date is in the future)
    if (daysUntilStart > 0) {
      return `Starts in ${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}`;
    }
    
    // If project has started, show duration
    const duration = this.getProjectDuration(project);
    if (duration < 0) {
      // This shouldn't happen, but handle edge case
      return `Starts in ${Math.abs(duration)} day${Math.abs(duration) !== 1 ? 's' : ''}`;
    }
    return `${duration} day${duration !== 1 ? 's' : ''}`;
  }

  getProjectPosition(project: IProjectTimeline): number {
    const range = this.dateRange();
    const totalDays =
      (range.max.getTime() - range.min.getTime()) / (1000 * 60 * 60 * 24);
    
    if (totalDays <= 0) return 0;
    
    const projectStart = new Date(project.startDate);
    const daysFromStart =
      (projectStart.getTime() - range.min.getTime()) / (1000 * 60 * 60 * 24);
    const position = (daysFromStart / totalDays) * 100;
    
    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, position));
  }

  getProjectWidth(project: IProjectTimeline): number {
    const range = this.dateRange();
    const totalDays =
      (range.max.getTime() - range.min.getTime()) / (1000 * 60 * 60 * 24);
    
    if (totalDays <= 0) return 0;
    
    const duration = Math.max(0, this.getProjectDuration(project));
    const width = (duration / totalDays) * 100;
    
    // Ensure width doesn't exceed available space
    const position = this.getProjectPosition(project);
    return Math.min(width, 100 - position);
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_progress':
      case 'in_review':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'on_hold':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'draft':
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }
}

