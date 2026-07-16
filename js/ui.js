// UI Utilities for DOM manipulation and rendering
export const UIUtils = (function() {
  // Format JavaScript code for display
  const formatJSCode = (codeStr) => {
    if (typeof codeStr !== "string") return "";
    return codeStr.replace(/\\n/g, "\n")
                  .replace(/\\t/g, "    ")
                  .replace(/\r\n/g, "\n")
                  .replace(/\\\"|\"\\"/g, '"')
                  .replace(/\\u0026/g, '&')
                  .replace(/\\u003c/g, '<')
                  .replace(/\\u003e/g, '>')
                  .trim();
  };

  // Escape raw text so it is safe to interpolate into innerHTML
  const escapeHTML = (text) => {
    const str = text == null ? "" : String(text);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Highlight search terms in text. Assumes `text` is already HTML-safe
  // (run untrusted/API-sourced strings through escapeHTML first).
  const highlightText = (text, keyword) => {
    if (!keyword) return text;
    const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    return text.replace(regex, `<span class="highlight">$1</span>`);
  };

  // Toggle accordion sections (updates only one icon)
  const toggleAccordion = (header, content, icon) => {
    const isExpanded = header.getAttribute('aria-expanded') === "true";
    header.setAttribute('aria-expanded', !isExpanded);
    content.style.display = isExpanded ? "none" : "block";
    icon.innerHTML = !isExpanded
      ? `<i class="fa fa-chevron-up"></i>`
      : `<i class="fa fa-chevron-down"></i>`;
  };

  // Create accordion items for rules, data elements, etc.
  const createAccordionItem = (item, options = {}) => {
    const { title, subtitle, searchKeyword, content } = options;
    const accordionItem = document.createElement('div');
    accordionItem.className = "accordion-item mb-4 p-2 border rounded bg-white";

    const header = document.createElement('div');
    header.className = "accordion-header px-2 flex justify-between items-center font-semibold text-lg";
    header.setAttribute("role", "button");
    header.setAttribute("aria-expanded", "false");

    const headerLeft = document.createElement('div');
    headerLeft.innerHTML = highlightText(escapeHTML(title), searchKeyword) + (subtitle ? ` ${subtitle}` : '');

    const headerRight = document.createElement('div');
    headerRight.className = "toggle-icon text-xl";
    headerRight.innerHTML = `<i class="fa fa-plus"></i>`;

    header.appendChild(headerLeft);
    header.appendChild(headerRight);

    const contentContainer = document.createElement('div');
    contentContainer.className = "accordion-content";
    contentContainer.style.display = "none";

    if (content) {
      contentContainer.appendChild(content);
    }

    header.addEventListener('click', () => {
      toggleAccordion(header, contentContainer, headerRight);
    });

    accordionItem.appendChild(header);
    accordionItem.appendChild(contentContainer);

    return accordionItem;
  };

  // Render attributes as a table
  const renderAttributesTable = (attributes) => {
    const table = document.createElement('table');
    table.className = "attributes-table";
    for (let key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        const tr = document.createElement('tr');
        const tdKey = document.createElement('td');
        tdKey.className = "px-2 py-1 font-medium";
        tdKey.textContent = key;
        const tdValue = document.createElement('td');
        tdValue.className = "px-2 py-1";
        let value = attributes[key];
        if (typeof value === 'object') {
          value = JSON.stringify(value, null, 2);
        }
        tdValue.textContent = value;
        tr.appendChild(tdKey);
        tr.appendChild(tdValue);
        table.appendChild(tr);
      }
    }
    return table;
  };

  // Create a titled section
  const createSection = (title, className = "") => {
    const section = document.createElement('div');
    if (className) { section.className = className; }
    const heading = document.createElement('h3');
    heading.className = "text-lg font-medium bg-gray-100 p-2 rounded mt-4 mb-2";
    heading.textContent = title;
    section.appendChild(heading);
    return section;
  };

  // Create a code block
  const createCodeBlock = (code, language = "") => {
    const pre = document.createElement('pre');
    pre.className = "component-bg p-2 rounded font-mono text-sm";
    pre.textContent = language === 'json'
      ? JSON.stringify(JSON.parse(code), null, 2)
      : formatJSCode(code);
    return pre;
  };

  // Show/hide loading indicator
  const toggleLoading = (show = true) => {
    document.getElementById('loadingIndicator').classList.toggle('hidden', !show);
  };

  // Check if "Show attributes" option is enabled
  const showAttributesEnabled = () => {
    return document.getElementById("showAttributes").checked;
  };

  // Clear UI container
  const clearContainer = (containerId) => {
    const container = document.getElementById(containerId);
    if (container) { container.innerHTML = ''; }
    return container;
  };

  return {
    formatJSCode,
    escapeHTML,
    highlightText,
    toggleAccordion,
    createAccordionItem,
    renderAttributesTable,
    createSection,
    createCodeBlock,
    toggleLoading,
    showAttributesEnabled,
    clearContainer
  };
})();
