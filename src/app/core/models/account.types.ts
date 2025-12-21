import { RoleEnum } from "../enum/RoleEnum";

export interface Profile {
  username: string;
  fullName: string;
  email: string;
  role: RoleEnum | undefined;
}

export const DEFAULT_PROFILE: Profile = {
  username: 'Example',
  fullName: 'Example',
  email: 'example@example.com',
  role: undefined
};
