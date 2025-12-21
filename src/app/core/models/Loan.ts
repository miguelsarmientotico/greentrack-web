export interface Loan {
  id: string;
  employeeId: string;
  deviceId: string;
  issuedAt: Date;
  returnedAt: Date;
  loanStatus: LoanStatusEnum;
}

export enum LoanStatusEnum {
  ACTIVO = 'ACTIVO',
  DEVUELTO = 'DEVUELTO',
}
