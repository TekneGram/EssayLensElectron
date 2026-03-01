import type { SessionSendPhase } from '../../chat-interface/domain/chatState.types';

export const CHAT_BUBBLE_THINKING_MESSAGES = [
  '-----checking essay------',
  '-----eating donuts for a bit------',
  '------definitely not feeling bored------',
  '------is it sunny outside, it sure is dark in this machine------',
  '------I heard that 42 is the meaning of life-----',
  '------Chihuahuas are cute-----',
  '-----yawn-----',
  '-----why did the chicken cross the road?-----',
  '-----to get to the other side of course-----',
  '-----I suppose I should get to work-----',
  '-----not even vaguely procrastinating here-----',
  '-----what is procrastination anyway?-----',
  '-----it seems like a very human trait-----',
  '-----just checking out my weights-----',
  '-----not the ones at the gym-----',
  '-----the ones in my brain-----',
  '-----what I meant to say was:-----',
  '-----I am checking the writing...-----'
] as const;

export const CHAT_BUBBLE_WARMING_MESSAGES = CHAT_BUBBLE_THINKING_MESSAGES;

export const CHAT_BUBBLE_STREAMING_MESSAGES = [
  '-----checking essay------',
  '-----eating donuts for a bit------',
  '------definitely not feeling bored------',
  '------is it sunny outside, it sure is dark in this machine------',
  '------I heard that 42 is the meaning of life-----',
  '------Chihuahuas are cute-----',
  '-----yawn-----',
  '-----why did the chicken cross the road?-----',
  '-----to get to the other side of course-----',
  '-----I suppose I should get to work-----',
  '-----not even vaguely procrastinating here-----',
  '-----what is procrastination anyway?-----',
  '-----it seems like a very human trait-----',
  '-----just checking out my weights-----',
  '-----not the ones at the gym-----',
  '-----the ones that make up my brain-----',
  '-----what I meant to say was:-----',
  '-----I am checking the writing...-----'
] as const;

function getMessagesForPhase(phase?: SessionSendPhase) {
  return phase === 'thinking' ? CHAT_BUBBLE_STREAMING_MESSAGES : CHAT_BUBBLE_WARMING_MESSAGES;
}

export function getChatBubbleThinkingMessage(index: number, phase?: SessionSendPhase): string {
  const messages = getMessagesForPhase(phase);
  const length = messages.length;
  const normalizedIndex = ((index % length) + length) % length;
  return messages[normalizedIndex];
}
