import { DeviceStatusEnum, DeviceTypeEnum } from './Device';

export interface DeviceFilter {
  id?: string;
  name?: string;
  brand?: string;
  type?: DeviceTypeEnum;
  status?: DeviceStatusEnum;
  globalSearch?: string;
}
