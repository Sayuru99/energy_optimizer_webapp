export type User = {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: string;
  facilityCode: string;
  facilityName: string;
};

export type SignupInput = {
  name: string;
  email: string;
  password: string;
  factoryName: string;
  phone: string;
};

export type Tariff = {
  id: string;
  period: string;
  startTime: string;
  endTime: string;
  rate: number;
};

export type Facility = {
  name: string;
  code: string;
  manager: string;
  role: string;
  tariff: string;
  startTime: string;
  endTime: string;
  workingDays: number;
};

export type Machine = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  power: number;
  hours: number;
  window: string;
  priority: string;
  saving: number;
  tone: string;
};

export type Optimization = {
  currentCost: number;
  optimizedCost: number;
  dailySaving: number;
  monthlySaving: number;
  energy: number;
  savingPercent: number;
};

export type ReportRow = {
  id: string;
  date: string;
  currentCost: number;
  optimizedCost: number;
  saving: number;
  energy: number;
};

export type PortalData = {
  users: User[];
  facility: Facility;
  tariffs: Tariff[];
  machines: Machine[];
  optimization: Optimization;
  reports: ReportRow[];
};

export type View = 'factory' | 'machines' | 'optimization' | 'dashboard' | 'reports';
