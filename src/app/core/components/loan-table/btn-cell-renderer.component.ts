import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { LoanStatusEnum } from '../../models/Loan';

@Component({
  selector: 'app-btn-cell-renderer',
  template: `
    @if (showReturnButton) {
      <button
        (click)="onReturn()"
        class="btn-devolver"
        title="Procesar Devolución">
        Devolver
      </button>
    } @else {
      <span>✅</span>
    }
  `,
  styles: [`
    .btn-container {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .btn {
      border: none;
      cursor: pointer;
      border-radius: 4px;
      padding: 5px 10px;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .btn-reset {
      background-color: #fca510;
      color: white;
    }

    .btn-reset:hover {
      background-color: #e69500;
    }

    .btn-delete {
      background-color: #ff4d4d;
      color: white;
    }

    .btn-delete:hover {
      background-color: #cc0000;
    }
  `]
})
export class BtnCellRenderer implements ICellRendererAngularComp {
  private params: any;
  public showReturnButton = true; // Por defecto true

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.updateVisibility();
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.updateVisibility();
    return true;
  }

  private updateVisibility() {
    if (this.params.data.loanStatus === LoanStatusEnum.DEVUELTO) {
      this.showReturnButton = false;
    } else {
      this.showReturnButton = true;
    }
  }

  onReturn() {
    if (this.params.onReturnClicked) {
      this.params.onReturnClicked(this.params.data);
    }
  }

  onDelete() {
    if (this.params.onDeleteClicked) {
      this.params.onDeleteClicked(this.params.data);
    }
  }
}
