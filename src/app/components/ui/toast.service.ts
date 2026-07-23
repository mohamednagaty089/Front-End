import { Injectable, signal } from '@angular/core';

export interface ToastOptions {
  title: string;
  description?: string;
  status?: 'success' | 'error' | 'info';
  duration?: number;
  dismissible?: boolean;
}

interface ToastInternal extends ToastOptions {
  id: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toastsSignal = signal<ToastInternal[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();
  private counter = 0;

  success(options: Omit<ToastOptions, 'status'>) {
    this.push({ ...options, status: 'success' });
  }

  error(options: Omit<ToastOptions, 'status'>) {
    this.push({ ...options, status: 'error' });
  }

  info(options: Omit<ToastOptions, 'status'>) {
    this.push({ ...options, status: 'info' });
  }

  dismiss(id: number) {
    this.toastsSignal.update((queue) =>
      queue.filter((toast) => toast.id !== id)
    );
  }

  clear() {
    this.toastsSignal.set([]);
  }

  private push(options: ToastOptions) {
    const toast: ToastInternal = {
      id: ++this.counter,
      duration: options.duration ?? 3500,
      dismissible: options.dismissible ?? true,
      ...options,
      status: options.status ?? 'info',
    };
    this.toastsSignal.update((queue) => [...queue, toast]);
    if (toast.duration && toast.duration > 0) {
      window.setTimeout(() => {
        this.dismiss(toast.id);
      }, toast.duration);
    }
  }
}
