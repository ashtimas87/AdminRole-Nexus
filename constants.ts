import { User, UserRole } from './types.ts';

const CHQ_NAMES = [
  'CHQ CARMU',
  'CHQ CIU',
  'CHQ COU',
  'CHQ Logistics',
  'CHQ CCADU',
  'CHQ CIDMU',
  'CHQ TPU',
  'CHQ WCPD',
  'CHQ CICTMU'
];

export const MOCK_USERS: User[] = [
  {
    id: 'sa-1',
    email: 'barvickrunch@gmail.com',
    password: 'Josepidal99',
    name: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
    avatar: 'https://picsum.photos/seed/sa1/100/100'
  },
  {
    id: 'sub-1',
    email: 'soldevilla.victor.pnpti@gmail.com',
    password: 'admin123',
    name: 'COCPO CPSMU',
    role: UserRole.SUB_ADMIN,
    avatar: 'https://picsum.photos/seed/sub1/100/100'
  },
  ...CHQ_NAMES.map((name, i) => ({
    id: `chq-${i + 1}`,
    email: `${name.replace('CHQ ', '').replace('&', 'and').replace(/\s+/g, '').toLowerCase()}@gmail.com`,
    password: 'admin123',
    name: name,
    role: UserRole.CHQ,
    avatar: `https://picsum.photos/seed/chq${i}/100/100`
  })),
  ...Array.from({ length: 11 }).map((_, i) => ({
    id: `st-${i + 1}`,
    email: i === 10 ? 'cocpocmfc@gmail.com' : `station${i + 1}@gmail.com`,
    password: 'admin123',
    name: i === 10 ? 'City Mobile Force Company' : `Police Station ${i + 1}`,
    role: UserRole.STATION,
    avatar: `https://picsum.photos/seed/st${i}/100/100`
  }))
];

export const ROLE_LABELS: Record<UserRole, { label: string; color: string; desc: string }> = {
  [UserRole.SUPER_ADMIN]: { 
    label: 'Super Admin', 
    color: 'bg-purple-600', 
    desc: 'Full system control, user oversight, and global configurations.' 
  },
  [UserRole.SUB_ADMIN]: { 
    label: 'Sub Admin', 
    color: 'bg-blue-600', 
    desc: 'Regional management and operational approvals.' 
  },
  [UserRole.CHQ]: { 
    label: 'CHQ User', 
    color: 'bg-emerald-600', 
    desc: 'Centralized data monitoring and administrative reporting.' 
  },
  [UserRole.STATION]: { 
    label: 'Station User', 
    color: 'bg-orange-600', 
    desc: 'Local facility operations and daily log management.' 
  }
};