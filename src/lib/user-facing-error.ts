const ENGLISH_TO_VI: Record<string, string> = {
  'No internet connection': 'Không có kết nối mạng',
  'Network request failed': 'Không có kết nối mạng',
  'Failed to fetch': 'Không có kết nối mạng',
  'Request timed out': 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.',
  'Request failed': 'Yêu cầu thất bại',
};

function normalizeMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return '';

  const mapped = ENGLISH_TO_VI[trimmed];
  if (mapped) return mapped;

  const statusMatch = /^Request failed \((\d+)\)$/.exec(trimmed);
  if (statusMatch) return `Yêu cầu thất bại (${statusMatch[1]})`;

  return trimmed;
}

/** Chuẩn hoá thông báo lỗi hiển thị cho người dùng (mặc định tiếng Việt). */
export function toUserFacingMessage(
  error: unknown,
  fallback = 'Có lỗi xảy ra. Vui lòng thử lại.',
): string {
  if (error instanceof Error) {
    const normalized = normalizeMessage(error.message);
    return normalized || fallback;
  }
  if (typeof error === 'string') {
    const normalized = normalizeMessage(error);
    return normalized || fallback;
  }
  return fallback;
}
