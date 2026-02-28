export function toChatBubbleRoleLabel(roleClassName: string): string {
  if (roleClassName === 'assistant') {
    return 'Assistant';
  }
  if (roleClassName === 'teacher') {
    return 'Teacher';
  }
  if (roleClassName === 'system') {
    return 'System';
  }
  return 'Message';
}
