export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

let current = $state<ConfirmRequest | null>(null);

export function getConfirmRequest(): ConfirmRequest | null {
  return current;
}

export function requestConfirm(request: ConfirmRequest) {
  current = request;
}

export function resolveConfirm(confirmed: boolean) {
  if (confirmed) current?.onConfirm();
  current = null;
}
