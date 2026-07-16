// Excel export: turns fetched Launch data into an .xlsx workbook via SheetJS

export const safeJsonParse = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const EXCEL_TEXT_LIMIT = 32767;

export const truncateExcelText = (text) => {
  if (typeof text !== "string") return text;
  if (text.length <= EXCEL_TEXT_LIMIT) return text;
  return `${text.slice(0, EXCEL_TEXT_LIMIT - 3)}...`;
};

// Normalizes any value (string, object, null) into a truncated Excel-safe string
export const stringifyForExcel = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    return truncateExcelText(JSON.stringify(value, null, 2));
  }
  return truncateExcelText(String(value));
};

export const extractComponentSettingValues = (settings) => {
  const normalized = typeof settings === "string" ? safeJsonParse(settings) : settings;
  if (!normalized || typeof normalized !== "object") return {};

  const getComparisonValue = (prop) => {
    const comparison = normalized.comparison || {};
    return comparison[prop] || comparison[prop.replace(/([A-Z])/g, '_$1').toLowerCase()];
  };

  return {
    "Source": stringifyForExcel(normalized.source),
    "Element Selector": stringifyForExcel(normalized.elementSelector || normalized.element_selector),
    "Anchor Delay": stringifyForExcel(normalized.anchorDelay || normalized.anchor_delay),
    "Bubble Fire If Parent": stringifyForExcel(normalized.bubbleFireIfParent),
    "Bubble Fire If Child Fired": stringifyForExcel(normalized.bubbleFireIfChildFired),
    "Language": stringifyForExcel(normalized.language),
    "Domains": stringifyForExcel(normalized.domains || normalized.domain),
    "Comparison Operator": stringifyForExcel(getComparisonValue('operator')),
    "Comparison Left Operand": stringifyForExcel(getComparisonValue('leftOperand') || getComparisonValue('left_operand')),
    "Comparison Right Operand": stringifyForExcel(getComparisonValue('rightOperand') || getComparisonValue('right_operand')),
    "Comparison Target": stringifyForExcel(getComparisonValue('target')),
    "Default Value": stringifyForExcel(normalized.defaultValue || normalized.default_value),
    "Force Lower Case": stringifyForExcel(normalized.forceLowerCase || normalized.force_lower_case),
    "Clean Text": stringifyForExcel(normalized.cleanText || normalized.clean_text),
    "Storage Duration": stringifyForExcel(normalized.storageDuration || normalized.storage_duration),
    "Settings": stringifyForExcel(normalized)
  };
};

export const getRevision = (item) => {
  return item.meta && item.meta.latest_revision_number
    ? item.meta.latest_revision_number
    : (item.attributes && item.attributes.latest_revision ? item.attributes.latest_revision : "N/A");
};

export const getDelegateType = (delegateDescriptorId = "") => {
  if (delegateDescriptorId.includes("::events::")) return "Event";
  if (delegateDescriptorId.includes("::conditions::")) return "Condition";
  if (delegateDescriptorId.includes("::actions::")) return "Action";
  if (delegateDescriptorId.includes("::dataElements::")) return "Data Element";
  return delegateDescriptorId ? "Other" : "";
};

export const getOrderedRuleComponents = (components = []) => {
  return [...components].sort((a, b) => {
    const aOrder = a.attributes && a.attributes.order !== undefined ? a.attributes.order : Number.MAX_SAFE_INTEGER;
    const bOrder = b.attributes && b.attributes.order !== undefined ? b.attributes.order : Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
};

export const getComponentDescriptor = (component) => {
  const attributes = component.attributes || {};
  return attributes.delegate_descriptor_id
    ? attributes.delegate_descriptor_id.replace(/::/g, "-")
    : "unknown-component";
};

export const buildComponentDescriptorSummary = (components = []) => {
  const counts = {};
  getOrderedRuleComponents(components).forEach(component => {
    const descriptor = getComponentDescriptor(component);
    counts[descriptor] = (counts[descriptor] || 0) + 1;
  });

  return Object.keys(counts)
    .map(descriptor => counts[descriptor] > 1 ? `${descriptor} (${counts[descriptor]})` : descriptor)
    .join(", ");
};

export const buildComponentValueText = (component, index) => {
  const attributes = component.attributes || {};
  const delegateDescriptorId = attributes.delegate_descriptor_id || "";
  const descriptor = getComponentDescriptor(component);
  const settingValues = extractComponentSettingValues(attributes.settings);
  const lines = [
    `${index + 1}. ${descriptor}`,
    component.id ? `Component ID: ${component.id}` : "",
    attributes.name ? `Component Name: ${attributes.name}` : "",
    getDelegateType(delegateDescriptorId) ? `Component Type: ${getDelegateType(delegateDescriptorId)}` : "",
    attributes.order !== undefined ? `Component Order: ${attributes.order}` : "",
    attributes.negate ? "Component Negate: Yes" : "",
    attributes.timeout !== undefined ? `Component Timeout: ${attributes.timeout}` : "",
    attributes.delay_next ? "Component Delay Next: Yes" : ""
  ].filter(Boolean);

  Object.entries(settingValues).forEach(([key, value]) => {
    if (key !== "Settings" && value !== "") {
      lines.push(`${key}: ${value}`);
    }
  });

  if (settingValues.Settings) {
    lines.push(`Settings: ${settingValues.Settings}`);
  }

  return lines.join("\n");
};

export const buildRuleComponentValues = (components = []) => {
  return getOrderedRuleComponents(components)
    .map((component, index) => buildComponentValueText(component, index))
    .join("\n\n");
};

export const countRuleComponents = (rules = []) => {
  return rules.reduce((count, rule) => count + ((rule.components || []).length), 0);
};

export const buildRulesSheetRows = (rules) => {
  return rules.map(rule => {
    const components = rule.components || [];
    return {
      "Rule ID": rule.id || "",
      "Rule Name": rule.attributes && rule.attributes.name ? rule.attributes.name : "Unnamed Rule",
      "Revision": getRevision(rule),
      "Published": rule.attributes && rule.attributes.published ? "Yes" : "No",
      "Enabled": rule.attributes && rule.attributes.enabled ? "Yes" : "No",
      "Dirty": rule.attributes && rule.attributes.dirty ? "Yes" : "No",
      "Created At": rule.attributes && rule.attributes.created_at ? rule.attributes.created_at : "",
      "Updated At": rule.attributes && rule.attributes.updated_at ? rule.attributes.updated_at : "",
      "Rule Components": buildComponentDescriptorSummary(components),
      "Rule Component Count": components.length,
      "Rule Component Values": truncateExcelText(buildRuleComponentValues(components)),
      "Rule Settings": stringifyForExcel(safeJsonParse(rule.attributes && rule.attributes.settings)),
      "Raw Attributes": stringifyForExcel(rule.attributes || {})
    };
  });
};

export const buildDataElementsSheetRows = (dataElements) => {
  return dataElements.map(dataElement => ({
    "Data Element ID": dataElement.id || "",
    "Data Element Name": dataElement.attributes && dataElement.attributes.name ? dataElement.attributes.name : "Unnamed Data Element",
    "Revision": getRevision(dataElement),
    "Published": dataElement.attributes && dataElement.attributes.published ? "Yes" : "No",
    "Enabled": dataElement.attributes && dataElement.attributes.enabled ? "Yes" : "No",
    "Delegate Descriptor ID": dataElement.attributes && dataElement.attributes.delegate_descriptor_id ? dataElement.attributes.delegate_descriptor_id : "",
    "Default Value": stringifyForExcel(dataElement.attributes && dataElement.attributes.default_value),
    "Force Lower Case": dataElement.attributes && dataElement.attributes.force_lower_case ? "Yes" : "No",
    "Clean Text": dataElement.attributes && dataElement.attributes.clean_text ? "Yes" : "No",
    "Storage Duration": dataElement.attributes && dataElement.attributes.storage_duration ? dataElement.attributes.storage_duration : "",
    "Created At": dataElement.attributes && dataElement.attributes.created_at ? dataElement.attributes.created_at : "",
    "Updated At": dataElement.attributes && dataElement.attributes.updated_at ? dataElement.attributes.updated_at : "",
    "Settings": stringifyForExcel(safeJsonParse(dataElement.attributes && dataElement.attributes.settings)),
    "Raw Attributes": stringifyForExcel(dataElement.attributes || {})
  }));
};

export const buildExtensionsSheetRows = (extensions) => {
  return extensions.map(extension => ({
    "Extension ID": extension.id || "",
    "Extension Name": extension.attributes && extension.attributes.display_name ? extension.attributes.display_name : "Unnamed Extension",
    "Name": extension.attributes && extension.attributes.name ? extension.attributes.name : "",
    "Revision": getRevision(extension),
    "Published": extension.attributes && extension.attributes.published ? "Yes" : "No",
    "Enabled": extension.attributes && extension.attributes.enabled ? "Yes" : "No",
    "Version": extension.attributes && extension.attributes.version ? extension.attributes.version : "",
    "Delegate Descriptor ID": extension.attributes && extension.attributes.delegate_descriptor_id ? extension.attributes.delegate_descriptor_id : "",
    "Created At": extension.attributes && extension.attributes.created_at ? extension.attributes.created_at : "",
    "Updated At": extension.attributes && extension.attributes.updated_at ? extension.attributes.updated_at : "",
    "Settings": stringifyForExcel(safeJsonParse(extension.attributes && extension.attributes.settings)),
    "Raw Attributes": stringifyForExcel(extension.attributes || {})
  }));
};

export const autoSizeColumns = (worksheet, rows) => {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  worksheet['!cols'] = columns.map(column => {
    const maxLength = rows.reduce((max, row) => {
      const value = row[column] === null || row[column] === undefined ? "" : String(row[column]);
      return Math.max(max, value.length);
    }, column.length);
    return { wch: Math.min(Math.max(maxLength + 2, 12), 80) };
  });
};

const addSheet = (workbook, sheetName, rows) => {
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ "Message": "No records found" }]);
  autoSizeColumns(worksheet, rows.length ? rows : [{ "Message": "No records found" }]);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
};

// Builds the full workbook payload (sheet name -> rows) without touching the DOM or XLSX
export const buildWorkbookSheets = (latestResults, { companyName = "", propertyName = "" } = {}) => {
  const ruleComponentCount = countRuleComponents(latestResults.rules);
  return {
    "Summary": [{
      "Exported At": new Date().toISOString(),
      "Company": companyName,
      "Property": propertyName,
      "Search Keyword": latestResults.searchKeyword || "",
      "Rules Count": latestResults.rules.length,
      "Rule Components Count": ruleComponentCount,
      "Data Elements Count": latestResults.dataElements.length,
      "Extensions Count": latestResults.extensions.length
    }],
    "Rules": buildRulesSheetRows(latestResults.rules),
    "Data Elements": buildDataElementsSheetRows(latestResults.dataElements),
    "Extensions": buildExtensionsSheetRows(latestResults.extensions)
  };
};

export const safePropertyFileName = (propertyName) => {
  return propertyName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'launch_property';
};

// Triggers the actual browser download; depends on the global XLSX (SheetJS) and DOM selects
export const downloadExcel = (latestResults, { companySelectEl, propertySelectEl } = {}) => {
  if (typeof XLSX === "undefined") {
    alert("Excel export library is not loaded. Please check your internet connection and refresh the page.");
    return;
  }

  const companyName = companySelectEl?.selectedOptions[0]?.text || "";
  const propertyName = propertySelectEl?.selectedOptions[0]?.text || "";

  const workbook = XLSX.utils.book_new();
  const sheets = buildWorkbookSheets(latestResults, { companyName, propertyName });
  Object.entries(sheets).forEach(([sheetName, rows]) => addSheet(workbook, sheetName, rows));

  const safePropertyName = safePropertyFileName(propertyName || "launch_property");
  XLSX.writeFile(workbook, `launch-assistant-${safePropertyName}-${Date.now()}.xlsx`);
};
