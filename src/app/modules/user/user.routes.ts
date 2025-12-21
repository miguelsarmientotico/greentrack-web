import { Dashboard } from "./dashboard/dashboard";
import { Devices } from "./devices/devices";
import { Loans } from "./loans/loans";
import { Users } from "./users/users";

export default [
  { path: '', component: Dashboard },
  { path: 'users', component: Users },
  { path: 'devices', component: Devices },
  { path: 'loans', component: Loans },
];

