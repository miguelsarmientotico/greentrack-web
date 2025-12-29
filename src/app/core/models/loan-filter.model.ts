import { DeviceStatusEnum } from "./Device";
import { DeviceTypeEnum } from "./Device";
import { LoanStatusEnum } from "./Loan";
import { RoleEnum } from "../enum/RoleEnum";
import { UserStatusEnum } from "../enum/UserStatusEnum";

export interface LoanFilter {
  id?: string;

  // Employee Params
  employeeId?: string;
  employeeUsername?: string;
  employeeFullName?: string;
  employeeEmail?: string;
  employeeStatus?: UserStatusEnum;
  employeeRole?: RoleEnum;

  // Device Params
  deviceId?: string;
  deviceName?: string;
  deviceBrand?: string;
  deviceType?: DeviceTypeEnum;
  deviceStatus?: DeviceStatusEnum;

  // Loan Params
  issuedAt?: string;
  startIssuedAt?: string;
  endIssuedAt?: string;
  returnedAt?: string;
  startReturnedAt?: string;
  endReturnedAt?: string;
  status?: LoanStatusEnum;

  globalSearch?: string;
}
