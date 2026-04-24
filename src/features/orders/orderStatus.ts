export type OrderStatusPresentation = {
  label: string;
  textColor: string;
  bgColor: string;
};

export function getOrderStatusPresentation(
  orderStatus: string,
  orderLabelStatus?: string | null,
): OrderStatusPresentation {
  const normalized = (orderStatus || '').toLowerCase().trim();
  const fallbackLabel = orderLabelStatus || orderStatus || 'Không xác định';

  switch (normalized) {
    case 'delivered':
      return { label: fallbackLabel, textColor: '#22C55E', bgColor: '#DCFCE7' };
    case 'delivering':
    case 'shipped':
    case 'tpl_transit':
    case 'ready_to_ship':
      return { label: fallbackLabel, textColor: '#3B82F6', bgColor: '#EAF2FF' };
    case 'processing':
    case 'new':
      return { label: fallbackLabel, textColor: '#16A34A', bgColor: '#DCFCE7' };
    case 'cancelled':
    case 'returned':
    case 'on_return':
    case 'return_received':
    case 'partial_returned':
      return { label: fallbackLabel, textColor: '#EF4444', bgColor: '#FEE2E2' };
    default:
      return { label: fallbackLabel, textColor: '#64748B', bgColor: '#E2E8F0' };
  }
}
