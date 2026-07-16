import { describe, it, expect } from 'vitest';
import {
  safeJsonParse,
  truncateExcelText,
  stringifyForExcel,
  extractComponentSettingValues,
  getRevision,
  getDelegateType,
  getOrderedRuleComponents,
  buildComponentDescriptorSummary,
  countRuleComponents,
  buildRulesSheetRows,
  buildDataElementsSheetRows,
  buildExtensionsSheetRows,
  buildWorkbookSheets,
  safePropertyFileName
} from '../js/excel.js';

describe('safeJsonParse', () => {
  it('parses valid JSON strings', () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
  });

  it('returns the original string when parsing fails', () => {
    expect(safeJsonParse('not json')).toBe('not json');
  });

  it('passes through non-string values unchanged', () => {
    const obj = { a: 1 };
    expect(safeJsonParse(obj)).toBe(obj);
  });
});

describe('truncateExcelText', () => {
  it('leaves short strings untouched', () => {
    expect(truncateExcelText('short')).toBe('short');
  });

  it('truncates strings over the Excel cell limit with an ellipsis', () => {
    const long = 'a'.repeat(40000);
    const result = truncateExcelText(long);
    expect(result.length).toBe(32767);
    expect(result.endsWith('...')).toBe(true);
  });
});

describe('stringifyForExcel', () => {
  it('returns empty string for null/undefined', () => {
    expect(stringifyForExcel(null)).toBe('');
    expect(stringifyForExcel(undefined)).toBe('');
  });

  it('stringifies objects as pretty JSON', () => {
    expect(stringifyForExcel({ a: 1 })).toBe(JSON.stringify({ a: 1 }, null, 2));
  });

  it('stringifies primitives via String()', () => {
    expect(stringifyForExcel(42)).toBe('42');
    expect(stringifyForExcel(true)).toBe('true');
  });
});

describe('extractComponentSettingValues', () => {
  it('returns empty object for non-object settings', () => {
    expect(extractComponentSettingValues(undefined)).toEqual({});
    expect(extractComponentSettingValues('not json')).toEqual({});
  });

  it('reads both camelCase and snake_case comparison fields', () => {
    const values = extractComponentSettingValues(JSON.stringify({
      comparison: { operator: 'equals', left_operand: 'a', rightOperand: 'b' }
    }));
    expect(values['Comparison Operator']).toBe('equals');
    expect(values['Comparison Left Operand']).toBe('a');
    expect(values['Comparison Right Operand']).toBe('b');
  });

  it('accepts settings already parsed as an object', () => {
    const values = extractComponentSettingValues({ source: 'window' });
    expect(values['Source']).toBe('window');
  });
});

describe('getRevision', () => {
  it('prefers meta.latest_revision_number', () => {
    expect(getRevision({ meta: { latest_revision_number: 5 }, attributes: { latest_revision: 1 } })).toBe(5);
  });

  it('falls back to attributes.latest_revision', () => {
    expect(getRevision({ attributes: { latest_revision: 3 } })).toBe(3);
  });

  it('falls back to N/A when nothing is present', () => {
    expect(getRevision({})).toBe('N/A');
  });
});

describe('getDelegateType', () => {
  it('classifies known descriptor segments', () => {
    expect(getDelegateType('adobe-analytics::events::page-load')).toBe('Event');
    expect(getDelegateType('core::conditions::compare')).toBe('Condition');
    expect(getDelegateType('core::actions::customCode')).toBe('Action');
    expect(getDelegateType('adobe-alloy::dataElements::xdm-object')).toBe('Data Element');
  });

  it('returns Other for unrecognized non-empty descriptors, empty string for none', () => {
    expect(getDelegateType('mystery::thing')).toBe('Other');
    expect(getDelegateType('')).toBe('');
  });
});

describe('getOrderedRuleComponents / buildComponentDescriptorSummary', () => {
  const components = [
    { attributes: { order: 2, delegate_descriptor_id: 'core::actions::a' } },
    { attributes: { order: 0, delegate_descriptor_id: 'core::events::b' } },
    { attributes: { delegate_descriptor_id: 'core::actions::a' } }
  ];

  it('sorts by order, treating missing order as last', () => {
    const ordered = getOrderedRuleComponents(components);
    expect(ordered.map(c => c.attributes.delegate_descriptor_id)).toEqual([
      'core::events::b',
      'core::actions::a',
      'core::actions::a'
    ]);
  });

  it('summarizes repeated descriptors with a count', () => {
    expect(buildComponentDescriptorSummary(components)).toBe(
      'core-events-b, core-actions-a (2)'
    );
  });
});

describe('countRuleComponents', () => {
  it('sums components across rules', () => {
    const rules = [{ components: [1, 2] }, { components: [3] }, {}];
    expect(countRuleComponents(rules)).toBe(3);
  });
});

describe('sheet row builders', () => {
  it('buildRulesSheetRows fills defaults for missing attributes', () => {
    const rows = buildRulesSheetRows([{ id: 'r1', attributes: {} }]);
    expect(rows[0]['Rule Name']).toBe('Unnamed Rule');
    expect(rows[0]['Published']).toBe('No');
    expect(rows[0]['Rule Component Count']).toBe(0);
  });

  it('buildDataElementsSheetRows fills defaults for missing attributes', () => {
    const rows = buildDataElementsSheetRows([{ id: 'd1', attributes: {} }]);
    expect(rows[0]['Data Element Name']).toBe('Unnamed Data Element');
  });

  it('buildExtensionsSheetRows fills defaults for missing attributes', () => {
    const rows = buildExtensionsSheetRows([{ id: 'e1', attributes: {} }]);
    expect(rows[0]['Extension Name']).toBe('Unnamed Extension');
  });
});

describe('buildWorkbookSheets', () => {
  it('produces Summary/Rules/Data Elements/Extensions sheets with counts', () => {
    const latestResults = {
      rules: [{ id: 'r1', attributes: {}, components: [{}] }],
      dataElements: [{ id: 'd1', attributes: {} }],
      extensions: [],
      searchKeyword: 'checkout'
    };
    const sheets = buildWorkbookSheets(latestResults, { companyName: 'Acme', propertyName: 'Prod' });
    expect(Object.keys(sheets)).toEqual(['Summary', 'Rules', 'Data Elements', 'Extensions']);
    expect(sheets.Summary[0]).toMatchObject({
      Company: 'Acme',
      Property: 'Prod',
      'Search Keyword': 'checkout',
      'Rules Count': 1,
      'Rule Components Count': 1,
      'Data Elements Count': 1,
      'Extensions Count': 0
    });
  });
});

describe('safePropertyFileName', () => {
  it('replaces non-alphanumeric characters and lowercases', () => {
    expect(safePropertyFileName('My Prod (US)!')).toBe('my_prod__us__');
  });

  it('falls back to launch_property for empty input', () => {
    expect(safePropertyFileName('')).toBe('launch_property');
  });
});
