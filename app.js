// Global configuration object
let config = {
  accessToken: "",
  orgId: "",
  clientId: "",
  clientSecret: ""
};

/**
 * Helper function to render an attributes object as an HTML table without borders.
 * @param {object} attributes 
 * @returns {HTMLElement} table element
 */
function renderAttributesTable(attributes) {
  const table = document.createElement('table');
  for (let key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      const tr = document.createElement('tr');
      const tdKey = document.createElement('td');
      tdKey.className = "px-2 py-1 font-medium";
      tdKey.innerText = key;
      const tdValue = document.createElement('td');
      tdValue.className = "px-2 py-1";
      let value = attributes[key];
      if (typeof value === 'object') {
        value = JSON.stringify(value, null, 2);
      }
      tdValue.innerText = value;
      tr.appendChild(tdKey);
      tr.appendChild(tdValue);
      table.appendChild(tr);
    }
  }
  return table;
}

function updateGlobalConfig() {
  config.accessToken = document.getElementById('accessToken').value.trim();
  config.orgId = document.getElementById('orgId').value.trim();
  config.clientId = document.getElementById('clientId').value.trim();
  config.clientSecret = document.getElementById('clientSecret').value.trim();
}

function filterResultObject(obj) {
  let clone = JSON.parse(JSON.stringify(obj));
  delete clone.relationships;
  delete clone.links;
  delete clone.meta;
  delete clone.components;
  if (clone.attributes && clone.attributes.settings) {
    delete clone.attributes.settings;
  }
  return clone;
}

function formatJSCode(codeStr) {
  if (typeof codeStr !== "string") return "";
  let cleaned = codeStr.replace(/\\n/g, "\n")
                       .replace(/\\t/g, "    ")
                       .replace(/\r\n/g, "\n")
                       .trim();
  return cleaned;
}

function highlightText(text, keyword) {
  if (!keyword) return text;
  const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedKeyword})`, 'gi');
  return text.replace(regex, `<span class="highlight">$1</span>`);
}

function toggleAccordion(header, content, icon) {
  const isExpanded = header.getAttribute('aria-expanded') === "true";
  header.setAttribute('aria-expanded', !isExpanded);
  content.style.display = isExpanded ? "none" : "block";
  icon.innerHTML = isExpanded ? `<i class="fa fa-chevron-down"></i>` : `<i class="fa fa-chevron-up"></i>`;
}

// Utility to check whether "Show attributes" is enabled
function showAttributesEnabled() {
  return document.getElementById("showAttributes").checked;
}

// Load stored settings from sessionStorage
window.addEventListener('load', () => {
  const storedAccessToken = sessionStorage.getItem('accessToken');
  if (storedAccessToken) document.getElementById('accessToken').value = storedAccessToken;
  const storedOrgId = sessionStorage.getItem('orgId');
  if (storedOrgId) document.getElementById('orgId').value = storedOrgId;
  const storedClientId = sessionStorage.getItem('clientId');
  if (storedClientId) document.getElementById('clientId').value = storedClientId;
  const storedClientSecret = sessionStorage.getItem('clientSecret');
  if (storedClientSecret) document.getElementById('clientSecret').value = storedClientSecret;
});

// Toggle Configuration Accordion
const configHeader = document.getElementById('configHeader');
const configContent = document.getElementById('configContent');
const configToggleIcon = document.getElementById('configToggleIcon');
configHeader.addEventListener('click', () => {
  toggleAccordion(configHeader, configContent, configToggleIcon);
});

// Update Settings Button
document.getElementById('updateSettings').addEventListener('click', async () => {
  updateGlobalConfig();
  if (config.accessToken && config.orgId && config.clientId && config.clientSecret) {
    sessionStorage.setItem('accessToken', config.accessToken);
    sessionStorage.setItem('orgId', config.orgId);
    sessionStorage.setItem('clientId', config.clientId);
    sessionStorage.setItem('clientSecret', config.clientSecret);
    document.getElementById('settingsMessage').innerText = "Settings updated successfully!";
    await fetchCompanies();
  } else {
    document.getElementById('settingsMessage').innerText = "Please fill in all fields.";
  }
});

// Fetch companies from API and populate company select
async function fetchCompanies() {
  const url = "https://reactor.adobe.io/companies";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + config.accessToken,
        "x-api-key": config.clientId,
        "x-gw-ims-org-id": config.orgId,
        "Content-Type": "application/vnd.api+json",
        "Accept": "application/vnd.api+json;revision=1"
      }
    });
    const data = await response.json();
    const companySelect = document.getElementById("companySelect");
    companySelect.innerHTML = '<option value="">Select Company</option>';
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach(company => {
        const option = document.createElement("option");
        option.value = company.id;
        option.text = company.attributes.name;
        companySelect.appendChild(option);
      });
    }
    document.getElementById("mainApp").classList.remove("hidden");
  } catch (err) {
    console.error("Error fetching companies", err);
    document.getElementById("settingsMessage").innerText = "Error fetching companies. Check your credentials.";
  }
}

// When a company is selected, fetch its properties
document.getElementById('companySelect').addEventListener('change', function() {
  const companyId = this.value;
  if (companyId) {
    fetchPropertiesForCompany(companyId);
  }
});

// Fetch properties for a selected company
async function fetchPropertiesForCompany(companyId) {
  const url = `https://reactor.adobe.io/companies/${companyId}/properties`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + config.accessToken,
        "x-api-key": config.clientId,
        "x-gw-ims-org-id": config.orgId,
        "Content-Type": "application/vnd.api+json",
        "Accept": "application/vnd.api+json;revision=1"
      }
    });
    const data = await response.json();
    const propertySelect = document.getElementById("propertySelect");
    propertySelect.innerHTML = '<option value="">Select Property</option>';
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach(prop => {
        const option = document.createElement("option");
        option.value = prop.id;
        option.text = prop.attributes.name;
        propertySelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Error fetching properties", err);
  }
}

// Tab Switching Logic
const tabButtons = document.querySelectorAll('.tab-btn');
tabButtons.forEach(btn => {
  btn.addEventListener('click', function() {
    const tabName = this.getAttribute('data-tab');
    tabButtons.forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.tab').forEach(tab => {
      tab.style.display = 'none';
    });
    document.getElementById(tabName).style.display = 'block';
  });
});

// Toggle All Accordion Sections
let allExpanded = false;
document.getElementById('toggleAll').addEventListener('click', function() {
  const contents = document.querySelectorAll('.accordion-content');
  if (allExpanded) {
    contents.forEach(content => content.style.display = "none");
    this.textContent = "Expand All";
    allExpanded = false;
  } else {
    contents.forEach(content => content.style.display = "block");
    this.textContent = "Collapse All";
    allExpanded = true;
  }
});

// Render functions for dynamic data

function renderDetailsResults(rules, searchKeyword) {
  const resultsDiv = document.getElementById('searchResults');
  let serial = 1;
  rules.forEach(rule => {
    const accordionItem = document.createElement('div');
    accordionItem.className = "accordion-item mb-4 p-2 border rounded bg-white";
    
    const ruleName = rule.attributes.name || "Unnamed Rule";
    const rev = rule.meta && rule.meta.latest_revision_number ? rule.meta.latest_revision_number : (rule.attributes.latest_revision || "N/A");
    const published = rule.attributes.published ? "Published" : "Not Published";
    const enabled = rule.attributes.enabled ? "Enabled" : "Not Enabled";
    let headerMain = highlightText(ruleName, searchKeyword);
    let headerDetails = `<span class="text-sm text-gray-500">(Rev: ${rev}, ${published}, ${enabled})</span>`;
    
    const header = document.createElement('div');
    header.className = "accordion-header flex justify-between items-center font-semibold text-lg";
    header.setAttribute("role", "button");
    header.setAttribute("aria-expanded", "false");
    const headerLeft = document.createElement('div');
    headerLeft.innerHTML = `<span class="mr-2">${serial++}.</span> ${headerMain} ${headerDetails}`;
    const headerRight = document.createElement('div');
    headerRight.className = "toggle-icon text-xl";
    headerRight.innerHTML = `<i class="fa fa-plus"></i>`;
    header.appendChild(headerLeft);
    header.appendChild(headerRight);
    
    const content = document.createElement('div');
    content.className = "accordion-content"; // padding set via CSS to 1.2rem
    content.style.display = "none";
    
    // If "Show attributes" is enabled, render the attributes table.
    // Otherwise, do not render any attributes.
    if (showAttributesEnabled() && rule.attributes) {
      const table = renderAttributesTable(rule.attributes);
      content.appendChild(table);
    } else {
      // Do not append any attributes or message
    }
    
    // Render settings code block if present
    if (rule.attributes && rule.attributes.settings) {
      const settingsHeader = document.createElement('h3');
      settingsHeader.className = "text-lg font-bold bg-blue-100 p-2 rounded mt-4 mb-2";
      settingsHeader.innerText = "Settings:";
      content.appendChild(settingsHeader);
      const codeBlock = document.createElement('pre');
      codeBlock.className = "component-bg p-2 rounded font-mono text-sm";
      codeBlock.innerText = formatJSCode(rule.attributes.settings);
      content.appendChild(codeBlock);
    }
    
    // Render Rule Components
    if (rule.components && rule.components.length > 0) {
      const compHeader = document.createElement('h3');
      compHeader.className = "text-lg font-bold bg-blue-100 p-2 rounded mt-4 mb-2";
      compHeader.innerText = "Rule Components:";
      content.appendChild(compHeader);
      rule.components.forEach(comp => {
        const compItem = document.createElement('div');
        compItem.className = "mb-2 p-2 pl-4 border rounded component-bg";
        
        if (showAttributesEnabled() && comp.attributes) {
          const compTable = renderAttributesTable(comp.attributes);
          compItem.appendChild(compTable);
        } else {
          // Do not render any attributes if not enabled
        }
        
        if (comp.attributes && comp.attributes.name) {
          const compTitle = document.createElement('h4');
          compTitle.className = "text-base font-medium mb-1";
          compTitle.innerText = comp.attributes.name;
          compItem.insertBefore(compTitle, compItem.firstChild);
        }
        
        // Render settings for component if exists.
        if (comp.attributes && comp.attributes.settings) {
          let settingsTitle = "Settings";
          if (comp.attributes.delegate_descriptor_id) {
            settingsTitle += " [" + comp.attributes.delegate_descriptor_id + "]";
          }
          const compSetHeader = document.createElement('h3');
          // Remove background styling from rule component settings header
          compSetHeader.className = "text-lg font-bold p-2 rounded mt-2 mb-2";
          compSetHeader.innerText = settingsTitle;
          compItem.appendChild(compSetHeader);
          const compCodeBlock = document.createElement('pre');
          compCodeBlock.className = "component-bg p-2 rounded font-mono text-sm";
          compCodeBlock.innerText = formatJSCode(comp.attributes.settings);
          compItem.appendChild(compCodeBlock);
        }
        content.appendChild(compItem);
      });
    }
    
    header.addEventListener('click', () => {
      if (content.style.display === "block") {
        content.style.display = "none";
        header.setAttribute("aria-expanded", "false");
        headerRight.innerHTML = `<i class="fa fa-plus"></i>`;
      } else {
        content.style.display = "block";
        header.setAttribute("aria-expanded", "true");
        headerRight.innerHTML = `<i class="fa fa-minus"></i>`;
      }
    });
    
    accordionItem.appendChild(header);
    accordionItem.appendChild(content);
    resultsDiv.appendChild(accordionItem);
  });
}

function renderPropertyDetails(dataElements, extensions, searchKeyword) {
  const resultsDiv = document.getElementById('searchResults');
  
  if (dataElements.length > 0) {
    const deHeader = document.createElement('h3');
    deHeader.className = "text-xl font-bold bg-blue-100 p-2 rounded mt-6 mb-2";
    deHeader.innerText = "Data Elements:";
    resultsDiv.appendChild(deHeader);
    dataElements.forEach(de => {
      const accordionItem = document.createElement('div');
      accordionItem.className = "accordion-item mb-4 p-2 border rounded bg-white";
      const deName = de.attributes.name || "Unnamed Data Element";
      const rev = de.meta && de.meta.latest_revision_number ? de.meta.latest_revision_number : (de.attributes.latest_revision || "N/A");
      const published = de.attributes.published ? "Published" : "Not Published";
      const enabled = de.attributes.enabled ? "Enabled" : "Not Enabled";
      let headerMain = highlightText(deName, searchKeyword);
      let headerDetails = `<span class="text-sm text-gray-500">(Rev: ${rev}, ${published}, ${enabled})</span>`;
      const header = document.createElement('div');
      header.className = "accordion-header flex justify-between items-center font-semibold text-lg";
      header.setAttribute("role", "button");
      header.setAttribute("aria-expanded", "false");
      const headerLeft = document.createElement('div');
      headerLeft.innerHTML = headerMain + " " + headerDetails;
      const headerRight = document.createElement('div');
      headerRight.className = "toggle-icon text-xl";
      headerRight.innerHTML = `<i class="fa fa-plus"></i>`;
      header.appendChild(headerLeft);
      header.appendChild(headerRight);
      
      const content = document.createElement('div');
      content.className = "accordion-content";
      content.style.display = "none";
      
      if (showAttributesEnabled() && de.attributes) {
        const table = renderAttributesTable(de.attributes);
        content.appendChild(table);
      } else {
        // Do not render any attributes if not enabled
      }
      
      if (de.attributes.settings) {
        const deSetHeader = document.createElement('h3');
        deSetHeader.className = "text-lg font-bold bg-blue-100 p-2 rounded mt-2 mb-2";
        deSetHeader.innerText = "Settings:";
        content.appendChild(deSetHeader);
        const deCodeBlock = document.createElement('pre');
        deCodeBlock.className = "component-bg p-2 rounded font-mono text-sm";
        deCodeBlock.innerText = formatJSCode(de.attributes.settings);
        content.appendChild(deCodeBlock);
      }
      
      header.addEventListener('click', () => {
        if (content.style.display === "block") {
          content.style.display = "none";
          header.setAttribute("aria-expanded", "false");
          headerRight.innerHTML = `<i class="fa fa-plus"></i>`;
        } else {
          content.style.display = "block";
          header.setAttribute("aria-expanded", "true");
          headerRight.innerHTML = `<i class="fa fa-minus"></i>`;
        }
      });
      
      accordionItem.appendChild(header);
      accordionItem.appendChild(content);
      resultsDiv.appendChild(accordionItem);
    });
  }
  
  if (extensions.length > 0) {
    const extHeader = document.createElement('h3');
    extHeader.className = "text-xl font-bold bg-blue-100 p-2 rounded mt-6 mb-2";
    extHeader.innerText = "Extensions:";
    resultsDiv.appendChild(extHeader);
    extensions.forEach(ext => {
      const accordionItem = document.createElement('div');
      accordionItem.className = "accordion-item mb-4 p-2 border rounded bg-white";
      const extName = ext.attributes.display_name || "Unnamed Extension";
      const rev = ext.meta && ext.meta.latest_revision_number ? ext.meta.latest_revision_number : (ext.attributes.latest_revision || "N/A");
      const published = ext.attributes.published ? "Published" : "Not Published";
      const enabled = ext.attributes.enabled ? "Enabled" : "Not Enabled";
      let headerMain = highlightText(extName, searchKeyword);
      let headerDetails = `<span class="text-sm text-gray-500">(Rev: ${rev}, ${published}, ${enabled})</span>`;
      const header = document.createElement('div');
      header.className = "accordion-header flex justify-between items-center font-semibold text-lg";
      header.setAttribute("role", "button");
      header.setAttribute("aria-expanded", "false");
      const headerLeft = document.createElement('div');
      headerLeft.innerHTML = headerMain + " " + headerDetails;
      const headerRight = document.createElement('div');
      headerRight.className = "toggle-icon text-xl";
      headerRight.innerHTML = `<i class="fa fa-plus"></i>`;
      header.appendChild(headerLeft);
      header.appendChild(headerRight);
      
      const content = document.createElement('div');
      content.className = "accordion-content";
      content.style.display = "none";
      
      if (showAttributesEnabled() && ext.attributes) {
        const table = renderAttributesTable(ext.attributes);
        content.appendChild(table);
      } else {
        // Do not render any attributes if not enabled
      }
      
      if (ext.attributes.settings) {
        let settingsTitle = "Settings";
        if (ext.attributes.delegate_descriptor_id) {
          settingsTitle += " [" + ext.attributes.delegate_descriptor_id + "]";
        }
        const extSetHeader = document.createElement('h3');
        extSetHeader.className = "text-lg font-bold bg-blue-100 p-2 rounded mt-2 mb-2";
        extSetHeader.innerText = settingsTitle;
        content.appendChild(extSetHeader);
        const extCodeBlock = document.createElement('pre');
        extCodeBlock.className = "component-bg p-2 rounded font-mono text-sm";
        extCodeBlock.innerText = formatJSCode(ext.attributes.settings);
        content.appendChild(extCodeBlock);
      }
      
      header.addEventListener('click', () => {
        if (content.style.display === "block") {
          content.style.display = "none";
          header.setAttribute("aria-expanded", "false");
          headerRight.innerHTML = `<i class="fa fa-plus"></i>`;
        } else {
          content.style.display = "block";
          header.setAttribute("aria-expanded", "true");
          headerRight.innerHTML = `<i class="fa fa-minus"></i>`;
        }
      });
      
      accordionItem.appendChild(header);
      accordionItem.appendChild(content);
      resultsDiv.appendChild(accordionItem);
    });
  }
}

// Show loading indicator
function showLoading(show = true) {
  const indicator = document.getElementById('loadingIndicator');
  indicator.classList.toggle('hidden', !show);
}

// Get Details Button Logic
document.getElementById('getDetailsBtn').addEventListener('click', async () => {
  const query = document.getElementById('searchQuery').value.trim();
  const propertyId = document.getElementById('propertySelect').value;
  if (!propertyId) {
    alert("Please select a property.");
    return;
  }
  showLoading(true);
  try {
    let rules = await fetchAllRules(propertyId);
    const searchForRevisions = document.getElementById('searchRevisions').checked;
    if (!searchForRevisions) {
      rules = rules.filter(rule => rule.attributes && rule.attributes.published === true);
    }
    if (query) {
      rules = rules.filter(rule => rule.attributes && rule.attributes.name && rule.attributes.name.toLowerCase().includes(query.toLowerCase()));
    }
    for (let rule of rules) {
      rule.components = await fetchRuleComponents(rule.id);
    }
    const dataElements = await fetchAllDataElements(propertyId);
    const extensions = await fetchExtensions(propertyId);
    
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = "";
    if (rules.length > 0) {
      const rulesHeader = document.createElement('h3');
      rulesHeader.className = "text-xl font-bold bg-blue-100 p-2 rounded mb-4";
      rulesHeader.innerText = "Rules:";
      resultsDiv.appendChild(rulesHeader);
    }
    renderDetailsResults(rules, query);
    renderPropertyDetails(dataElements, extensions, query);
  } catch (error) {
    console.error("Error in Get Details:", error);
    alert("An error occurred while fetching details. Please check the console for more information.");
  } finally {
    showLoading(false);
  }
});

// API fetching functions for rules, data elements, components, and extensions
async function fetchAllRules(propertyId) {
  let rules = [];
  let pageNumber = 1;
  let totalPages = 1;
  do {
    const url = `https://reactor.adobe.io/properties/${propertyId}/rules?page[size]=100&page[number]=${pageNumber}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + config.accessToken,
        "x-api-key": config.clientId,
        "x-gw-ims-org-id": config.orgId,
        "Content-Type": "application/vnd.api+json",
        "Accept": "application/vnd.api+json;revision=1"
      }
    });
    const data = await response.json();
    if (data.data) {
      rules = rules.concat(data.data);
    }
    if (data.meta && data.meta.pagination) {
      totalPages = data.meta.pagination.total_pages;
    }
    pageNumber++;
  } while (pageNumber <= totalPages);
  return rules;
}

async function fetchAllDataElements(propertyId) {
  let dataElements = [];
  let pageNumber = 1;
  let totalPages = 1;
  do {
    const url = `https://reactor.adobe.io/properties/${propertyId}/data_elements?page[size]=100&page[number]=${pageNumber}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + config.accessToken,
        "x-api-key": config.clientId,
        "x-gw-ims-org-id": config.orgId,
        "Content-Type": "application/vnd.api+json",
        "Accept": "application/vnd.api+json;revision=1"
      }
    });
    const data = await response.json();
    if (data.data) {
      dataElements = dataElements.concat(data.data);
    }
    if (data.meta && data.meta.pagination) {
      totalPages = data.meta.pagination.total_pages;
    }
    pageNumber++;
  } while (pageNumber <= totalPages);
  return dataElements;
}

async function fetchRuleComponents(ruleId) {
  const url = `https://reactor.adobe.io/rules/${ruleId}/rule_components`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + config.accessToken,
      "x-api-key": config.clientId,
      "x-gw-ims-org-id": config.orgId,
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json;revision=1"
    }
  });
  const data = await response.json();
  return data.data || [];
}

async function fetchExtensions(propertyId) {
  const url = `https://reactor.adobe.io/properties/${propertyId}/extensions`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + config.accessToken,
      "x-api-key": config.clientId,
      "x-gw-ims-org-id": config.orgId,
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json;revision=1"
    }
  });
  const data = await response.json();
  return data.data || [];
}
