import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '@/app/service/attendaceService';
import { ApiResponse } from '@/app/service/genericService';
import { AttendanceRecord } from '@/app/model/class/AttendanceRecord';
import { UbButtonDirective } from '@/app/components/ui/button';
import { Member } from '@/app/model/class/Member';

@Component({
  selector: 'app-attendance-today',
  standalone: true,
  imports: [CommonModule, UbButtonDirective],
  templateUrl: './attendance-today.component.html',
  styleUrls: ['./attendance-today.component.css'],
})
export class AttendanceTodayComponent implements OnInit {
  private readonly attendanceService = inject(AttendanceService);

  readonly records = signal<Member[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly successCount = computed(() => this.records().length);

  ngOnInit(): void {
    this.loadToday();
  }

  loadToday() {
    this.loading.set(true);
    this.error.set('');
    this.attendanceService.getTodayAttendances().subscribe({
      next: (res: ApiResponse<Member[]>) => {
        this.records.set(res?.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('تعذر جلب الحضور اليوم.');
        console.error('Error loading today attendance', err);
      }
    });
  }
}
