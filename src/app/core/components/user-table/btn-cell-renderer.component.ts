import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-btn-cell-renderer',
  standalone: true,
  template: `
    <div class="btn-container">
      <button
        (click)="onResetPass()"
        class="btn btn-reset"
        title="Cambiar Contraseña">
        🔑
      </button>

      <button
        (click)="onDelete()"
        class="btn btn-delete"
        title="Eliminar Usuario">
        🗑️
      </button>
    </div>
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

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    return true;
  }

  onResetPass() {
    if (this.params.onResetClicked) {
      this.params.onResetClicked(this.params.data);
    }
  }

  onDelete() {
    if (this.params.onDeleteClicked) {
      this.params.onDeleteClicked(this.params.data);
    }
  }
}
