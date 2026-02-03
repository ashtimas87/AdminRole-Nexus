
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUB_ADMIN = 'SUB_ADMIN',
  CHQ = 'CHQ',
  STATION = 'STATION'
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface MonthFile {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export interface MonthData {
  value: number;
  files: MonthFile[];
}

export interface PIActivity {
  activity: string;
  indicator: string;
  months: MonthData[];
  total: number;
}

export interface PIData {
  id: string;
  title: string;
  activities: PIActivity[];
}
