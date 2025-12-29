import { RoleEnum } from "../enum/RoleEnum";
import { UserStatusEnum } from "../enum/UserStatusEnum";

export interface UserFilter {
  id?: string;
  username?: string;
  fullName?: string;
  email?: string;
  status?: UserStatusEnum;
  role?: RoleEnum;
  globalSearch?: string;
}
