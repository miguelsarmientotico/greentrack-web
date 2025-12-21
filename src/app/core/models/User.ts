import { RoleEnum } from "../enum/RoleEnum";

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  email: string;
  userStatus: string;
  role: RoleEnum;
}
