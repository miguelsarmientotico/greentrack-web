export interface Pagination<T> {
  content: T[];       // Aquí vienen tus usuarios
  totalElements: number; // El total para el paginador
  totalPages: number;
  size: number;
  page: number;
}
