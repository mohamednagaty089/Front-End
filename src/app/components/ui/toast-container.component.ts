import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed top-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-3"
      role="status"
      aria-live="polite"
      dir="rtl"
    >
      <div
        *ngFor="let toast of toasts()"
        class="rounded-2xl border border-white/10 bg-slate-900/85 p-4 text-sm text-white shadow-lg shadow-slate-950/45 backdrop-blur text-right"
        [class]="statusClass(toast.status)"
        [@toastTransition]
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-semibold leading-none">{{ toast.title }}</p>
            <p *ngIf="toast.description || toast.message" class="mt-1 text-xs text-white/70">
              {{ toast.description ?? toast.message }}
            </p>
          </div>
          <button
            *ngIf="toast.dismissible"
            type="button"
            class="rounded-full bg-white/10 p-1 text-white/70 transition hover:bg-white/20 hover:text-white"
            (click)="dismiss(toast.id)"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  `,
  animations: [
    trigger('toastTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px) scale(0.98)' }),
        animate(
          '180ms ease',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '150ms ease',
          style({ opacity: 0, transform: 'translateY(12px) scale(0.98)' })
        ),
      ]),
    ]),
  ],
  styleUrl: './toast-container.component.css',
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  dismiss(id: number) {
    this.toastService.dismiss(id);
  }

  statusClass(status: 'success' | 'error' | 'warning' | 'info' = 'info') {
    switch (status) {
      case 'success':
        return 'border-emerald-400/60 bg-emerald-500/95 text-slate-950';
      case 'error':
        return 'border-rose-500/60 bg-rose-500/95 text-white';
      case 'warning':
        return 'border-amber-400/40 bg-amber-500/20 text-slate-950';
      default:
        return 'border-blue-400/40 bg-blue-500/15';
    }
  }
}
