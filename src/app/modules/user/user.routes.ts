import { authGuard } from "../../core/guards/auth-guard";
import { roleGuard } from "../../core/guards/role-guard";
import { Dashboard } from "./dashboard/dashboard";
import { Devices } from "./devices/devices";
import { Loans } from "./loans/loans";
import { NewLoan } from "./loans/new/new-loan";
import { Users } from "./users/users";

export default [
  {
    path: '',
    component: Dashboard,
    canActivate: [authGuard]
  },
  {
    path: 'users',
    component: Users,
    canActivate: [roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'devices',
    component: Devices,
    canActivate: [authGuard]
  },
  {
    path: 'loans',
    component: Loans,
    canActivate: [authGuard]
  },
  {
    path: 'loans/new',
    component: NewLoan,
    canActivate: [authGuard]
  },
];

