import { Injectable } from '@angular/core';

/** A page button in the UI: a page number, or '...' for a gap. */
export type PageToken = number | '...';

export interface PageInfo {
  /** Current page, 1-based. Always clamped to a valid page. */
  page: number;
  pageSize: number;
  totalItems: number;
  /** Always at least 1, even for an empty list. */
  totalPages: number;
  /** 0-based index of the first item on this page (slice start). */
  startIndex: number;
  /** 0-based index after the last item on this page (slice end). */
  endIndex: number;
  /** 1-based range for text like "Showing 11-20 of 84". Both are 0 for an empty list. */
  from: number;
  to: number;
  hasPrev: boolean;
  hasNext: boolean;
  /** Buttons to render, e.g. [1, '...', 4, 5, 6, '...', 20]. */
  pages: PageToken[];
}

export interface PageResult<T> extends PageInfo {
  /** The items that belong on the current page. */
  items: T[];
}

/**
 * Stateless pagination helper, so it can be shared by any component.
 * The component keeps its own `currentPage` and `pageSize`.
 *
 * Client-side:  this.pageData = this.pagination.paginate(list, this.currentPage, this.pageSize);
 * Server-side:  this.pageInfo = this.pagination.getPageInfo(totalFromApi, this.currentPage, this.pageSize);
 */
@Injectable({ providedIn: 'root' })
export class PaginationService {
  readonly defaultPageSize = 10;

  /** Slice a full list into the requested page and return it with the page info. */
  paginate<T>(
    items: T[] | null | undefined,
    page = 1,
    pageSize = this.defaultPageSize,
    siblings = 1
  ): PageResult<T> {
    const list = items ?? [];
    const info = this.getPageInfo(list.length, page, pageSize, siblings);
    return { ...info, items: list.slice(info.startIndex, info.endIndex) };
  }

  /** Page info only, with no slicing. Use it when the API already returns one page at a time. */
  getPageInfo(
    totalItems: number,
    page = 1,
    pageSize = this.defaultPageSize,
    siblings = 1
  ): PageInfo {
    const size = Math.max(1, Math.floor(Number(pageSize)) || this.defaultPageSize);
    const total = Math.max(0, Math.floor(Number(totalItems)) || 0);
    const totalPages = Math.max(1, Math.ceil(total / size));
    const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), totalPages);
    const startIndex = (current - 1) * size;
    const endIndex = Math.min(startIndex + size, total);

    return {
      page: current,
      pageSize: size,
      totalItems: total,
      totalPages,
      startIndex,
      endIndex,
      from: total === 0 ? 0 : startIndex + 1,
      to: endIndex,
      hasPrev: current > 1,
      hasNext: current < totalPages,
      pages: this.getPageNumbers(current, totalPages, siblings),
    };
  }

  /**
   * Page buttons with gaps, e.g. 1 ... 4 5 6 ... 20.
   * `siblings` is how many pages to show on each side of the current page.
   */
  getPageNumbers(current: number, totalPages: number, siblings = 1): PageToken[] {
    // first + last + current + 2 gaps + siblings on both sides
    if (totalPages <= siblings * 2 + 5) {
      return this.range(1, totalPages);
    }

    const left = Math.max(current - siblings, 1);
    const right = Math.min(current + siblings, totalPages);
    const showLeftGap = left > 2;
    const showRightGap = right < totalPages - 1;
    const edgeCount = 3 + 2 * siblings; // pages shown on the side that has no gap

    if (!showLeftGap && showRightGap) {
      return [...this.range(1, edgeCount), '...', totalPages];
    }
    if (showLeftGap && !showRightGap) {
      return [1, '...', ...this.range(totalPages - edgeCount + 1, totalPages)];
    }
    return [1, '...', ...this.range(left, right), '...', totalPages];
  }

  private range(start: number, end: number): number[] {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}
