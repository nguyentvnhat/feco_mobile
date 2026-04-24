import type { AgentRow } from './components/AgentRowCard';

export const MOCK_AGENTS: AgentRow[] = [
  {
    id: '1',
    businessName: 'Garage Minh Phát',
    area: 'TP.HCM',
    status: 'Hoạt động',
    statusColor: '#16A34A',
    statusBg: '#DCFCE7',
  },
  {
    id: '2',
    businessName: 'Đại lý Phụ tùng Hải Nam',
    area: 'Đà Nẵng',
    status: 'Chờ duyệt',
    statusColor: '#D97706',
    statusBg: '#FFEDD5',
  },
  {
    id: '3',
    businessName: 'Trung tâm Dịch vụ FECO Bắc Ninh',
    area: 'Bắc Ninh',
    status: 'Tạm khóa',
    statusColor: '#64748B',
    statusBg: '#F1F5F9',
  },
];
