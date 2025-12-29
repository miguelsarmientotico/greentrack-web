export interface Device {
  id: string;
  name: string;
  type: DeviceTypeEnum;
  brand: string;
  status: DeviceStatusEnum;
}

export enum DeviceTypeEnum {
  LAPTOP = 'LAPTOP',
  MONITOR = 'MONITOR',
  TABLET = 'TABLET',
  CELULAR = 'CELULAR'
}

export enum DeviceStatusEnum {
  DISPONIBLE = 'DISPONIBLE',
  PRESTADO = 'PRESTADO',
}

