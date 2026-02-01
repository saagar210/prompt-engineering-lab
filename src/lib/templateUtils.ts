/**
 * Extract {{variable}} patterns from prompt content.
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables = new Set<string>();
  let match;
  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1]);
  }
  return Array.from(variables);
}

/**
 * Substitute {{variable}} patterns with provided values.
 */
export function substituteVariables(
  content: string,
  values: Record<string, string>
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (fullMatch, varName) => {
    return varName in values ? values[varName] : fullMatch;
  });
}
