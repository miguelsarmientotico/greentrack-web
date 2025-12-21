export interface Device {
  id: string;
  name: string;
  deviceType: DeviceTypeEnum;
  brand: string;
  deviceStatus: DeviceStatusEnum;
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

