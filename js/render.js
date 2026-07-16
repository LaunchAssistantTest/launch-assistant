// Rendering: turns fetched rules/data elements/extensions into accordion DOM
import { UIUtils } from './ui.js';

export const renderResults = (rules, dataElements, extensions, searchKeyword) => {
  const resultsDiv = UIUtils.clearContainer('searchResults');
  if (rules.length > 0) {
    const rulesHeader = document.createElement('h3');
    rulesHeader.className = "text-xl font-bold bg-blue-100 p-2 rounded mb-4";
    rulesHeader.textContent = "Rules:";
    resultsDiv.appendChild(rulesHeader);
    renderRules(rules, searchKeyword, resultsDiv);
  }
  renderPropertyDetails(dataElements, extensions, searchKeyword, resultsDiv);
};

export const renderRules = (rules, searchKeyword, container) => {
  rules.forEach(rule => {
    const ruleName = rule.attributes.name || "Unnamed Rule";
    const rev = rule.meta && rule.meta.latest_revision_number
      ? rule.meta.latest_revision_number
      : (rule.attributes.latest_revision || "N/A");
    const published = rule.attributes.published ? "Published" : "Not Published";
    const enabled = rule.attributes.enabled ? "Enabled" : "Not Enabled";
    const detailsSpan = document.createElement('span');
    detailsSpan.className = "inline-block text-gray-400 bg-gray-100 font-normal rounded-3xl px-5 py-1 text-sm mr-1";
    detailsSpan.textContent = `Rev: ${rev} -- ${published} -- ${enabled}`;
    const contentDiv = document.createElement('div');
    if (UIUtils.showAttributesEnabled() && rule.attributes) {
      contentDiv.appendChild(UIUtils.renderAttributesTable(rule.attributes));
    }
    if (rule.attributes && rule.attributes.settings) {
      const settingsSection = UIUtils.createSection("Settings:");
      settingsSection.appendChild(UIUtils.createCodeBlock(rule.attributes.settings));
      contentDiv.appendChild(settingsSection);
    }
    if (rule.components && rule.components.length > 0) {
      // Group rule components by delegate_descriptor_id type
      const groups = { events: [], conditions: [], actions: [] };
      rule.components.forEach(comp => {
        const ddid = comp.attributes.delegate_descriptor_id || "";
        if (ddid.includes("::events::")) {
          groups.events.push(comp);
        } else if (ddid.includes("::conditions::")) {
          groups.conditions.push(comp);
        } else if (ddid.includes("::actions::")) {
          groups.actions.push(comp);
        } else {
          groups.conditions.push(comp);
        }
      });
      const componentsSection = UIUtils.createSection("Rule Components:");
      // Render groups in fixed order
      ["events", "conditions", "actions"].forEach(groupName => {
        if (groups[groupName].length > 0) {
          // Use the first component's delegate_descriptor_id to generate title tiles
          let rawTitle = groups[groupName][0].attributes.delegate_descriptor_id;
          let cleanedTitle = rawTitle.replace(/::/g, " ");
          const words = cleanedTitle.split(" ").filter(word => word.trim() !== "");
          const titleHTML = words.map(word => `<span class="inline-block bg-gray-300 font-medium rounded px-2 py-1.5 text-sm mr-1">${UIUtils.escapeHTML(word)}</span>`).join("");
          const groupHeader = document.createElement('h3');
          groupHeader.className = "text-lg font-bold bg-white-200 p-2 rounded mt-4 mb-2";
          groupHeader.innerHTML = titleHTML;
          componentsSection.appendChild(groupHeader);
          // Render each component in the group
          groups[groupName].forEach(comp => {
            const compItem = document.createElement('div');
            compItem.className = "mb-2 p-2 pl-4 border rounded component-bg";
            if (UIUtils.showAttributesEnabled() && comp.attributes) {
              compItem.appendChild(UIUtils.renderAttributesTable(comp.attributes));
            }

            if (comp.attributes && comp.attributes.settings) {
              try {
                compItem.appendChild(UIUtils.createCodeBlock(JSON.stringify(JSON.parse(comp.attributes.settings), null, 2)));
              } catch (error) {
                compItem.appendChild(UIUtils.createCodeBlock(comp.attributes.settings));
              }
            }

            componentsSection.appendChild(compItem);
          });
        }
      });
      contentDiv.appendChild(componentsSection);
    }
    const accordionItem = UIUtils.createAccordionItem(rule, {
      title: ruleName,
      subtitle: detailsSpan.outerHTML,
      searchKeyword,
      content: contentDiv
    });
    container.appendChild(accordionItem);
  });
};

export const renderPropertyDetails = (dataElements, extensions, searchKeyword, container) => {
  if (dataElements.length > 0) {
    const deHeader = document.createElement('h3');
    deHeader.className = "text-xl font-bold bg-blue-100 p-2 rounded mt-6 mb-2";
    deHeader.textContent = "Data Elements:";
    container.appendChild(deHeader);
    dataElements.forEach(de => {
      const deName = de.attributes.name || "Unnamed Data Element";
      const rev = de.meta && de.meta.latest_revision_number
        ? de.meta.latest_revision_number
        : (de.attributes.latest_revision || "N/A");
      const published = de.attributes.published ? "Published" : "Not Published";
      const enabled = de.attributes.enabled ? "Enabled" : "Not Enabled";
      const detailsSpan = document.createElement('span');

      detailsSpan.textContent = `Rev: ${rev} --- ${published} --- ${enabled}`;
      if (detailsSpan.textContent.match(/not published/ig)) {
        detailsSpan.className = "inline-block text-orange-400 bg-gray-100 font-normal rounded-3xl px-5 py-1 text-sm mr-1";
      } else {
        detailsSpan.className = "inline-block text-gray-400 bg-gray-100 font-normal rounded-3xl px-5 py-1 text-sm mr-1";
      }

      const contentDiv = document.createElement('div');
      if (UIUtils.showAttributesEnabled() && de.attributes) {
        contentDiv.appendChild(UIUtils.renderAttributesTable(de.attributes));
      }
      if (de.attributes.settings) {
        const settingsSection = UIUtils.createSection("Settings:");
        if (
          de.type === "data_elements" &&
          de.attributes.delegate_descriptor_id === "adobe-alloy::dataElements::xdm-object"
        ) {
          try {
            const jsonObj = typeof de.attributes.settings === "string"
              ? JSON.parse(de.attributes.settings)
              : de.attributes.settings;
            contentDiv.appendChild(UIUtils.createCodeBlock(JSON.stringify(jsonObj, null, 2), 'json'));
          } catch (e) {
            contentDiv.appendChild(UIUtils.createCodeBlock(de.attributes.settings));
          }
        } else {
          contentDiv.appendChild(UIUtils.createCodeBlock(de.attributes.settings));
        }
      }
      const accordionItem = UIUtils.createAccordionItem(de, {
        title: deName,
        subtitle: detailsSpan.outerHTML,
        searchKeyword,
        content: contentDiv
      });
      container.appendChild(accordionItem);
    });
  }
  if (extensions.length > 0) {
    const extHeader = document.createElement('h3');
    extHeader.className = "text-xl font-bold bg-blue-100 p-2 rounded mt-6 mb-2";
    extHeader.textContent = "Extensions:";
    container.appendChild(extHeader);
    extensions.forEach(ext => {
      const extName = ext.attributes.display_name || "Unnamed Extension";
      const rev = ext.meta && ext.meta.latest_revision_number
        ? ext.meta.latest_revision_number
        : (ext.attributes.latest_revision || "N/A");
      const published = ext.attributes.published ? "Published" : "Not Published";
      const enabled = ext.attributes.enabled ? "Enabled" : "Not Enabled";
      const detailsSpan = document.createElement('span');
      detailsSpan.className = "inline-block text-gray-400 bg-gray-100 font-normal rounded-3xl px-5 py-1 text-sm mr-1";
      detailsSpan.textContent = `Rev: ${rev} -- ${published} -- ${enabled}`;
      const contentDiv = document.createElement('div');
      if (UIUtils.showAttributesEnabled() && ext.attributes) {
        contentDiv.appendChild(UIUtils.renderAttributesTable(ext.attributes));
      }
      if (ext.attributes.settings) {
        const settingsSection = UIUtils.createSection("Settings");
        settingsSection.appendChild(UIUtils.createCodeBlock(ext.attributes.settings));
        contentDiv.appendChild(settingsSection);
      }
      const accordionItem = UIUtils.createAccordionItem(ext, {
        title: extName,
        subtitle: detailsSpan.outerHTML,
        searchKeyword,
        content: contentDiv
      });
      container.appendChild(accordionItem);
    });
  }
};
