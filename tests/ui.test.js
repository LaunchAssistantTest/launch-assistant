import { describe, it, expect } from 'vitest';
import { UIUtils } from '../js/ui.js';

describe('UIUtils.escapeHTML', () => {
  it('escapes HTML-significant characters', () => {
    expect(UIUtils.escapeHTML('<img src=x onerror=alert(1)>'))
      .toBe('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('escapes ampersands and quotes', () => {
    expect(UIUtils.escapeHTML(`Tom & "Jerry" 'Show'`))
      .toBe('Tom &amp; &quot;Jerry&quot; &#39;Show&#39;');
  });

  it('returns empty string for null/undefined', () => {
    expect(UIUtils.escapeHTML(null)).toBe('');
    expect(UIUtils.escapeHTML(undefined)).toBe('');
  });
});

describe('UIUtils.highlightText', () => {
  it('wraps matches in a highlight span, case-insensitively', () => {
    expect(UIUtils.highlightText('Checkout Rule', 'checkout'))
      .toBe('<span class="highlight">Checkout</span> Rule');
  });

  it('returns text unchanged when keyword is empty', () => {
    expect(UIUtils.highlightText('Checkout Rule', '')).toBe('Checkout Rule');
  });

  it('escaping a malicious rule name before highlighting prevents markup injection', () => {
    const maliciousName = '<img src=x onerror=alert(1)>';
    const result = UIUtils.highlightText(UIUtils.escapeHTML(maliciousName), 'img');
    expect(result).not.toContain('<img');
    expect(result.toLowerCase()).toContain('&lt;');
  });
});

describe('UIUtils.formatJSCode', () => {
  it('unescapes literal newline/tab sequences', () => {
    expect(UIUtils.formatJSCode('line1\\nline2\\tindented')).toBe('line1\nline2    indented');
  });

  it('returns empty string for non-string input', () => {
    expect(UIUtils.formatJSCode(42)).toBe('');
    expect(UIUtils.formatJSCode(null)).toBe('');
  });
});
