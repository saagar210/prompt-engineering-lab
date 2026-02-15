import { extractVariables, substituteVariables } from '@/lib/templateUtils';

describe('templateUtils', () => {
  describe('extractVariables', () => {
    it('should extract variables from template', () => {
      const template = 'Hello {{name}}, you are {{age}} years old.';
      const variables = extractVariables(template);
      expect(variables).toEqual(['name', 'age']);
    });

    it('should return empty array for template without variables', () => {
      const template = 'Hello world!';
      const variables = extractVariables(template);
      expect(variables).toEqual([]);
    });

    it('should handle duplicate variables', () => {
      const template = '{{name}} is {{age}}, {{name}} again';
      const variables = extractVariables(template);
      // Should return unique variables only
      expect(variables).toEqual(['name', 'age']);
    });

    it('should handle nested braces', () => {
      const template = '{{outer{{inner}}}}';
      const variables = extractVariables(template);
      // Should extract based on the simple pattern
      expect(variables.length).toBeGreaterThan(0);
    });
  });

  describe('substituteVariables', () => {
    it('should substitute variables in template', () => {
      const template = 'Hello {{name}}, you are {{age}} years old.';
      const variables = { name: 'John', age: '30' };
      const result = substituteVariables(template, variables);
      expect(result).toBe('Hello John, you are 30 years old.');
    });

    it('should leave template unchanged if no variables provided', () => {
      const template = 'Hello {{name}}';
      const result = substituteVariables(template, {});
      expect(result).toBe('Hello {{name}}');
    });

    it('should handle missing variables', () => {
      const template = 'Hello {{name}}, you are {{age}} years old.';
      const variables = { name: 'John' };
      const result = substituteVariables(template, variables);
      expect(result).toBe('Hello John, you are {{age}} years old.');
    });

    it('should handle empty template', () => {
      const template = '';
      const variables = { name: 'John' };
      const result = substituteVariables(template, variables);
      expect(result).toBe('');
    });
  });
});
