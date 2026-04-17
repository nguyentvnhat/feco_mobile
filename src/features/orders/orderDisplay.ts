import type { OrderListItem } from './orders.types';

export type RecentOrderRow = {
  id: string;
  code: string;
  subtitle: string;
  amount: string;
  status: string;
  statusColor: string;
  statusBg: string;
};

function formatOrderDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
}

function statusStyleForOrder(orderStatus: string): { statusColor: string; statusBg: string } {
  switch (orderStatus) {
    case 'delivered':
      return { statusColor: '#22C55E', statusBg: '#EAFBF0' };
    case 'delivering':
    case 'shipped':
    case 'tpl_transit':
    case 'ready_to_ship':
      return { statusColor: '#3B82F6', statusBg: '#EAF2FF' };
    case 'cancelled':
    case 'returned':
    case 'on_return':
    case 'return_received':
    case 'partial_returned':
      return { statusColor: '#EF4444', statusBg: '#FEE2E2' };
    default:
      return { statusColor: '#F59E0B', statusBg: '#FFF5E8' };
  }
}

export function mapOrderToRecentRow(order: OrderListItem): RecentOrderRow {
  const name = order.customer?.customer_name?.trim() || '—';
  const date = formatOrderDate(order.order_date);
  const { statusColor, statusBg } = statusStyleForOrder(order.order_status);
  const code = order.order_no.startsWith('#') ? order.order_no : `#${order.order_no}`;

  return {
    id: String(order.id),
    code,
    subtitle: date ? `${name} • ${date}` : name,
    amount: order.net_amount,
    status: order.order_label_status,
    statusColor,
    statusBg,
  };
}
