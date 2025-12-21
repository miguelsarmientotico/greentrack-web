import { Component, OnInit, inject } from '@angular/core'; // Agrega OnInit
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
  standalone: true, // Asumo que es standalone por los imports
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

  // 1. Variable para almacenar los datos de las tarjetas (Texto)
  // Inicializamos en 0 para evitar errores en el HTML al inicio
  stats: DashboardSummary = {
    users: { total: 0 },
    devices: { total: 0, available: 0, borrowed: 0 },
    loans: { total: 0, active: 0, returned: 0 }
  };

  // 2. Opciones Base para Gráfico 1 (Equipos)
  chartOptions: any = {
    animationEnabled: true,
    theme: "light2",
    title: { text: "Estado de Equipos" },
    data: [{
      type: "pie",
      startAngle: -90,
      indexLabel: "{name}: {y}",
      yValueFormatString: "#,###",
      dataPoints: [] // Empieza vacío
    }]
  };

  // 3. Opciones Base para Gráfico 2 (Préstamos)
  chartOptions2: any = {
    animationEnabled: true,
    theme: "light2",
    title: { text: "Estado de Préstamos" },
    data: [{
      type: "pie",
      startAngle: -90,
      indexLabel: "{name}: {y}",
      yValueFormatString: "#,###",
      dataPoints: [] // Empieza vacío
    }]
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.dashboardService.getDashboardSummary().subscribe({
      next: (data: DashboardSummary) => {
        // A. Guardamos los datos para las tarjetas numéricas
        this.stats = data;

        // B. Actualizamos Gráfico 1: Equipos (Disponibles vs Prestados)
        // Creamos un NUEVO objeto para forzar la actualización del gráfico
        this.chartOptions = {
          ...this.chartOptions,
          data: [{
            ...this.chartOptions.data[0],
            dataPoints: [
              { y: data.devices.available, name: "Disponibles", color: "#4caf50" }, // Verde
              { y: data.devices.borrowed, name: "Prestados", color: "#f44336" }    // Rojo
            ]
          }]
        };

        // C. Actualizamos Gráfico 2: Préstamos (Activos vs Devueltos)
        this.chartOptions2 = {
          ...this.chartOptions2,
          data: [{
            ...this.chartOptions2.data[0],
            dataPoints: [
              { y: data.loans.active, name: "Activos", color: "#ff9800" },   // Naranja
              { y: data.loans.returned, name: "Devueltos", color: "#2196f3" } // Azul
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
