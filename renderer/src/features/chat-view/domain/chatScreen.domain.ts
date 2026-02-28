export function isContainerNearBottom(container: HTMLElement, thresholdPx: number): boolean {
  const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
  return remaining <= thresholdPx;
}
