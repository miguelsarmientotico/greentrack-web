import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CanvasJSAngularChartsModule } from '@canvasjs/angular-charts';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardSummary } from '../../models/Dashboard';

@Component({
  selector: 'the-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  imports: [
    MatGridListModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    CommonModule,
    CanvasJSAngularChartsModule,
  ]
})
export class DashboardComponent implements OnInit {

  stats: DashboardSummary = {
    users: { total: 0 },
    devices: { total: 0, available: 0, borrowed: 0 },
    loans: { total: 0, active: 0, returned: 0 }
  };

  chartOptions: any = {
    animationEnabled: true,
    theme: "light2",
    title: { text: "Estado de Equipos" },
    data: [{
      type: "pie",
      startAngle: -90,
      indexLabel: "{name}: {y}",
      yValueFormatString: "#,###",
      dataPoints: []
    }]
  };

  chartOptions2: any = {
    animationEnabled: true,
    theme: "light2",
    title: { text: "Estado de Préstamos" },
    data: [{
      type: "pie",
      startAngle: -90,
      indexLabel: "{name}: {y}",
      yValueFormatString: "#,###",
      dataPoints: []
    }]
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.dashboardService.getDashboardSummary().subscribe({
      next: (data: DashboardSummary) => {
        this.stats = data;
        this.chartOptions = {
          ...this.chartOptions,
          data: [{
            ...this.chartOptions.data[0],
            dataPoints: [
              { y: data.devices.available, name: "Disponibles", color: "#4caf50" },
              { y: data.devices.borrowed, name: "Prestados", color: "#f44336" }
            ]
          }]
        };
        this.chartOptions2 = {
          ...this.chartOptions2,
          data: [{
            ...this.chartOptions2.data[0],
            dataPoints: [
              { y: data.loans.active, name: "Activos", color: "#ff9800" },
              { y: data.loans.returned, name: "Devueltos", color: "#2196f3" }
            ]
          }]
        };
      },
      error: (err) => {
        console.error('Error cargando dashboard', err);
      }
    });
  }
}
