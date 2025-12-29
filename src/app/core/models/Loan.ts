import { Device } from "./Device";
import { User } from "./User";

export interface Loan {
  id: string;
  employeeId: string;
  deviceId: string;
  issuedAt: Date;
  returnedAt: Date;
  status: LoanStatusEnum;
  device: Device
  employee: User
}

export enum LoanStatusEnum {
  ACTIVO = 'ACTIVO',
  DEVUELTO = 'DEVUELTO',
}
