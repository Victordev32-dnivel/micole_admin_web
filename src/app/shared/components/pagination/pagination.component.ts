import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="pagination-container" *ngIf="totalPages > 0">
      <div class="pagination-info">
        <span class="total-info">Total: {{ totalItems }}</span>

        <mat-form-field appearance="outline" class="page-size-select">
          <mat-select [value]="pageSize" (selectionChange)="onPageSizeChange($event.value)">
            <mat-option *ngFor="let size of pageSizeOptions" [value]="size">
              {{ size }} por página
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="pagination-controls">
        <button mat-icon-button
          [disabled]="currentPage <= 1 || disabled"
          (click)="goToPage(1)"
          title="Primera página">
          <mat-icon>first_page</mat-icon>
        </button>

        <button mat-icon-button
          [disabled]="currentPage <= 1 || disabled"
          (click)="goToPage(currentPage - 1)"
          title="Anterior">
          <mat-icon>chevron_left</mat-icon>
        </button>

        <button *ngFor="let page of visiblePages"
          mat-button
          [class.active]="page === currentPage"
          [disabled]="disabled"
          (click)="goToPage(page)"
          class="page-button">
          {{ page }}
        </button>

        <button mat-icon-button
          [disabled]="currentPage >= totalPages || disabled"
          (click)="goToPage(currentPage + 1)"
          title="Siguiente">
          <mat-icon>chevron_right</mat-icon>
        </button>

        <button mat-icon-button
          [disabled]="currentPage >= totalPages || disabled"
          (click)="goToPage(totalPages)"
          title="Última página">
          <mat-icon>last_page</mat-icon>
        </button>

        <span class="page-label">Página {{ currentPage }} de {{ totalPages }}</span>
      </div>
    </div>
  `,
  styles: [
    `
    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      flex-wrap: wrap;
      gap: 8px;
    }

    .pagination-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .total-info {
      font-size: 13px;
      color: #666;
    }

    .page-size-select {
      width: 150px;
    }

    ::ng-deep .page-size-select .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    ::ng-deep .page-size-select .mat-mdc-text-field-wrapper {
      padding: 0 8px;
      height: 36px;
    }

    ::ng-deep .page-size-select .mat-mdc-select-trigger {
      font-size: 13px;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .page-button {
      min-width: 36px;
      padding: 0 4px;
      font-size: 13px;
    }

    .page-button.active {
      background-color: #3f51b5;
      color: white;
      border-radius: 4px;
    }

    .page-label {
      font-size: 13px;
      color: #666;
      margin-left: 8px;
      white-space: nowrap;
    }

    @media (max-width: 768px) {
      .pagination-container {
        flex-direction: column;
        align-items: stretch;
      }

      .pagination-info {
        justify-content: space-between;
      }

      .pagination-controls {
        justify-content: center;
      }

      .page-label {
        display: none;
      }
    }
    `,
  ],
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 30;
  @Input() disabled = false;
  @Input() pageSizeOptions: number[] = [10, 20, 30, 50, 100];
  @Input() maxVisiblePages = 5;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  visiblePages: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentPage'] || changes['totalPages'] || changes['maxVisiblePages']) {
      this.updateVisiblePages();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSizeChange.emit(newSize);
  }

  private updateVisiblePages(): void {
    if (this.totalPages <= this.maxVisiblePages) {
      this.visiblePages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    } else {
      const half = Math.floor(this.maxVisiblePages / 2);
      let start = this.currentPage - half;
      let end = this.currentPage + half;

      if (start < 1) {
        start = 1;
        end = this.maxVisiblePages;
      } else if (end > this.totalPages) {
        end = this.totalPages;
        start = this.totalPages - this.maxVisiblePages + 1;
      }

      this.visiblePages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
  }
}
