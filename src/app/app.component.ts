import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { UbButtonDirective } from '@/app/components/ui/button';
import { ToastContainerComponent } from '@/app/components/ui/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    UbButtonDirective,
    ToastContainerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Employee Management';
  readonly currentYear = new Date().getFullYear();
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly layout = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.resolveLayout(this.activatedRoute))
    ),
    { initialValue: this.resolveLayout(this.activatedRoute) }
  );

  private resolveLayout(route: ActivatedRoute): string {
    let current: ActivatedRoute = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current.snapshot.data['layout'] ?? 'default';
  }
}
