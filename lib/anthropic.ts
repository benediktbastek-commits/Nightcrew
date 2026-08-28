import Anthropic from '@anthropic-ai/sdk';

export function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
}
