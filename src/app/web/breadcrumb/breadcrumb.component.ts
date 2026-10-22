import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationStart,
  Router,
  RouterLink,
} from '@angular/router';
import { filter } from 'rxjs';
import { BreadcrumbService } from './breadcrumb.service';

export interface Crumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private breadcrumbService = inject(BreadcrumbService);

  /** Crumbs built from route config (`data: { breadcrumb: '...' }`) */
  private routeCrumbs = signal<Crumb[]>([]);

  /** Route crumbs, with the last label replaced if a page set a dynamic one */
  crumbs = computed(() => {
    const list = [...this.routeCrumbs()];
    const dynamic = this.breadcrumbService.lastLabel();
    if (dynamic && list.length) {
      list[list.length - 1] = { ...list[list.length - 1], label: dynamic };
    }
    return list;
  });

  constructor() {
    // Build once now: if this component is created after the first navigation
    // has finished (e.g. inside a layout/header), NavigationEnd already fired
    this.routeCrumbs.set(this.build(this.route.root));
    console.log('crumbs:', this.build(this.route.root));

    // Clear any dynamic label from the previous page
    this.router.events
      .pipe(filter((e) => e instanceof NavigationStart), takeUntilDestroyed())
      .subscribe(() => this.breadcrumbService.lastLabel.set(null));

    // Rebuild crumbs after every successful navigation
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.routeCrumbs.set(this.build(this.route.root)));

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => {
        const crumbs = this.build(this.route.root);
        console.log('crumbs after navigation:', crumbs);
        this.routeCrumbs.set(crumbs);
      });
  }

  private build(route: ActivatedRoute, url = '', crumbs: Crumb[] = []): Crumb[] {
    const child = route.firstChild;
    if (!child) return crumbs;

    const segment = child.snapshot.url.map((s) => s.path).join('/');
    const nextUrl = segment ? `${url}/${segment}` : url;

    // routeConfig.data (not snapshot.data) avoids inherited duplicates
    const label = child.routeConfig?.data?.['breadcrumb'];
    if (label) {
      crumbs.push({ label, url: nextUrl || '/' });
    }

    return this.build(child, nextUrl, crumbs);
  }
}