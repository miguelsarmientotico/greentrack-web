import { Dashboard } from "./dashboard/dashboard";
import { Devices } from "./devices/devices";
import { Loans } from "./loans/loans";
import { NewLoan } from "./loans/new/new-loan";
import { Users } from "./users/users";

export default [
  { path: '', component: Dashboard },
  { path: 'users', component: Users },
  { path: 'devices', component: Devices },
  { path: 'loans', component: Loans },
  { path: 'loans/new', component: NewLoan },
];

