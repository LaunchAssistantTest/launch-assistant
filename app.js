// Config module for managing API credentials and authentication
const ConfigManager = (function() {
  const CONFIG_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    ORG_ID: 'orgId',
    CLIENT_ID: 'clientId',
    CLIENT_SECRET: 'clientSecret'
  };

  let config = {
    accessToken: "",
    orgId: "",
    clientId: "",
    clientSecret: ""
  };

  // Load stored settings from sessionStorage
  const loadStoredSettings = () => {
    Object.values(CONFIG_KEYS).forEach(key => {
      const storedValue = sessionStorage.getItem(key);
      if (storedValue) {
        document.getElementById(key).value = storedValue;
        config[key] = storedValue;
      }
    });
  };

  // Update config from form inputs
  const updateFromForm = () => {
    Object.values(CONFIG_KEYS).forEach(key => {
      config[key] = document.getElementById(key).value.trim();
    });
    return isConfigComplete();
  };

  // Save config to sessionStorage
  const saveToStorage = () => {
    Object.values(CONFIG_KEYS).forEach(key => {
      sessionStorage.setItem(key, config[key]);
    });
  };

  // Check if all config fields are filled
  const isConfigComplete = () => {
    return Object.values(config).every(value => value.trim() !== "");
  };

  // Get auth headers for API requests
  const getAuthHeaders = () => {
    return {
      "Authorization": "Bearer " + config.accessToken,
      "x-api-key": config.clientId,
      "x-gw-ims-org-id": config.orgId,
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json;revision=1"
    };
  };

  return {
    loadStoredSettings,
    updateFromForm,
    saveToStorage,
    isConfigComplete,
    getAuthHeaders,
    get: () => config
  };
})();

// API service for handling all API requests
const APIService = (function() {
  const API_BASE_URL = "https://reactor.adobe.io";

  // Generic fetch function with error handling
  const fetchAPI = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      method: "GET",
      headers: ConfigManager.getAuthHeaders()
    };
    
    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  };

  // Paginated fetch for endpoints that return multiple pages of results
  const fetchAllPages = async (endpoint) => {
    let results = [];
    let pageNumber = 1;
    let totalPages = 1;
    
    do {
      const paginatedEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}page[size]=100&page[number]=${pageNumber}`;
      const data = await fetchAPI(paginatedEndpoint);
      if (data.data) {
        results = results.concat(data.data);
      }
      if (data.meta && data.meta.pagination) {
        totalPages = data.meta.pagination.total_pages;
      }
      pageNumber++;
    } while (pageNumber <= totalPages);
    
    return results;
  };

  return {
    getCompanies: () => fetchAPI("/companies"),
    getProperties: (companyId) => fetchAPI(`/companies/${companyId}/properties`),
    getRules: (propertyId) => fetchAllPages(`/properties/${propertyId}/rules`),
    getDataElements: (propertyId) => fetchAllPages(`/properties/${propertyId}/data_elements`),
    getRuleComponents: (ruleId) => fetchAPI(`/rules/${ruleId}/rule_components`),
    getExtensions: (propertyId) => fetchAPI(`/properties/${propertyId}/extensions`)
  };
})();

// UI Utilities for DOM manipulation and rendering
const UIUtils = (function() {
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

  // Highlight search terms in text
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
    headerLeft.innerHTML = highlightText(title, searchKeyword) + (subtitle ? ` ${subtitle}` : '');
    
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

// Controller for handling the app's business logic
const AppController = (function() {
  const init = () => {
    attachEventListeners();
    ConfigManager.loadStoredSettings();
    setupUIState();
  };
  
  const setupUIState = () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons[0].classList.add('active');
    document.getElementById('search').style.display = 'block';
    if (ConfigManager.isConfigComplete()) {
      fetchCompanies();
    }
  };
  
  const attachEventListeners = () => {
    const configHeader = document.getElementById('configHeader');
    const configContent = document.getElementById('configContent');
    const configToggleIcon = document.getElementById('configToggleIcon');
    configHeader.addEventListener('click', () => {
      UIUtils.toggleAccordion(configHeader, configContent, configToggleIcon);
    });
    document.getElementById('updateSettings').addEventListener('click', updateSettings);
    document.getElementById('companySelect').addEventListener('change', handleCompanySelection);
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', handleTabSwitch);
    });
    document.getElementById('toggleAll').addEventListener('click', toggleAllAccordions);
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('getDetailsBtn').addEventListener('click', handleGetDetails);
  };
  
  const updateSettings = async () => {
    const messageEl = document.getElementById('settingsMessage');
    if (ConfigManager.updateFromForm()) {
      ConfigManager.saveToStorage();
      messageEl.textContent = "Settings updated successfully!";
      messageEl.className = "mt-2 text-green-600";
      await fetchCompanies();
      collapseConfigurationAccordion();
    } else {
      messageEl.textContent = "Please fill in all fields.";
      messageEl.className = "mt-2 text-red-600";
    }
  };
  
  const collapseConfigurationAccordion = () => {
    const configContent = document.getElementById('configContent');
    const configToggleIcon = document.getElementById('configToggleIcon');
    configContent.style.display = "none";
    document.getElementById('configHeader').setAttribute("aria-expanded", "false");
    configToggleIcon.innerHTML = `<i class="fa fa-chevron-down"></i>`;
  };
  
  const handleCompanySelection = function() {
    const companyId = this.value;
    if (companyId) { fetchPropertiesForCompany(companyId); }
  };
  
  const handleTabSwitch = function() {
    const tabName = this.getAttribute('data-tab');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.tab').forEach(tab => { tab.style.display = 'none'; });
    document.getElementById(tabName).style.display = 'block';
  };
  
  const toggleAllAccordions = function() {
    const contents = document.querySelectorAll('.accordion-content');
    const toggleButton = this;
    const allExpanded = toggleButton.textContent === "Collapse All";
    contents.forEach(content => { content.style.display = allExpanded ? "none" : "block"; });
    toggleButton.textContent = allExpanded ? "Expand All" : "Collapse All";
  };
  
  const handleSearch = function() {
    const query = document.getElementById('searchQuery').value.trim().toLowerCase();
    if (!query) return;
    const accordionItems = document.querySelectorAll('#searchResults .accordion-item');
    accordionItems.forEach(item => {
      let found = false;
      const header = item.querySelector('.accordion-header');
      let originalHeader = header.getAttribute('data-original');
      if (!originalHeader) {
        originalHeader = header.innerHTML;
        header.setAttribute('data-original', originalHeader);
      }
      if (originalHeader.toLowerCase().includes(query)) {
        found = true;
        header.innerHTML = UIUtils.highlightText(originalHeader, query);
      } else {
        header.innerHTML = originalHeader;
      }
      const preElements = item.querySelectorAll('pre');
      preElements.forEach(pre => {
        let originalText = pre.getAttribute('data-original');
        if (!originalText) {
          originalText = pre.innerHTML;
          pre.setAttribute('data-original', originalText);
        }
        if (pre.classList.contains('component-bg')) {
          originalText = UIUtils.formatJSCode(originalText);
        }
        if (originalText.toLowerCase().includes(query)) {
          found = true;
          pre.innerHTML = UIUtils.highlightText(originalText, query);
        } else {
          pre.innerHTML = originalText;
        }
      });
      item.style.display = found ? "block" : "none";
      if (found) {
        const content = item.querySelector('.accordion-content');
        const toggle = item.querySelector('.toggle-icon');
        if (content) { content.style.display = "block"; }
        if (toggle) { toggle.innerHTML = '<i class="fa fa-minus"></i>'; }
      }
    });
  };
  
  const handleGetDetails = async () => {
    const query = document.getElementById('searchQuery').value.trim();
    const propertyId = document.getElementById('propertySelect').value;
    if (!propertyId) {
      alert("Please select a property.");
      return;
    }
    UIUtils.toggleLoading(true);
    try {
      let rules = await APIService.getRules(propertyId);
      const searchForRevisions = document.getElementById('searchRevisions').checked;
      if (!searchForRevisions) {
        rules = rules.filter(rule => rule.attributes && rule.attributes.published === true);
      }
      if (query) {
        rules = rules.filter(rule => rule.attributes && rule.attributes.name && 
                                    rule.attributes.name.toLowerCase().includes(query.toLowerCase()));
      }
      for (let rule of rules) {
        const componentData = await APIService.getRuleComponents(rule.id);
        rule.components = componentData.data || [];
      }
      const dataElements = await APIService.getDataElements(propertyId);
      const extensionsData = await APIService.getExtensions(propertyId);
      const extensions = extensionsData.data || [];
      renderResults(rules, dataElements, extensions, query);
    } catch (error) {
      console.error("Error in Get Details:", error);
      alert("An error occurred while fetching details. Please check the console for more information.");
    } finally {
      UIUtils.toggleLoading(false);
    }
  };
  
  const fetchCompanies = async () => {
    try {
      const data = await APIService.getCompanies();
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
      document.getElementById("settingsMessage").textContent = "Error fetching companies. Check your credentials.";
      document.getElementById("settingsMessage").className = "mt-2 text-red-600";
    }
  };
  
  const fetchPropertiesForCompany = async (companyId) => {
    try {
      const data = await APIService.getProperties(companyId);
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
      alert("Error fetching properties. Please check your credentials.");
    }
  };
  
  const renderResults = (rules, dataElements, extensions, searchKeyword) => {
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
  
  const renderRules = (rules, searchKeyword, container) => {
    let serial = 1;
    rules.forEach(rule => {
      const ruleName = rule.attributes.name || "Unnamed Rule";
      const rev = rule.meta && rule.meta.latest_revision_number 
        ? rule.meta.latest_revision_number 
        : (rule.attributes.latest_revision || "N/A");
      const published = rule.attributes.published ? "Published" : "Not Published";
      const enabled = rule.attributes.enabled ? "Enabled" : "Not Enabled";
      const detailsSpan = document.createElement('span');
      detailsSpan.className = "text-sm text-gray-500";
      detailsSpan.textContent = `(Rev: ${rev}, ${published}, ${enabled})`;
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
            const titleHTML = words.map(word => `<span class="inline-block bg-gray-300 font-medium rounded px-2 py-1.5 text-sm mr-1">${word}</span>`).join("");
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

                compItem.appendChild(UIUtils.createCodeBlock(JSON.stringify(JSON.parse(comp.attributes.settings), null, 2)));
              } //JSON.stringify(comp.attributes.settings, null, 2), 'json')
              
              componentsSection.appendChild(compItem);
              
            });
          }
        });
        contentDiv.appendChild(componentsSection);
      }
      //const title = `<span class="mr-2">${serial++}.</span> ${ruleName}`;
      const title = `${ruleName}`;
      const accordionItem = UIUtils.createAccordionItem(rule, {
        title,
        subtitle: detailsSpan.outerHTML,
        searchKeyword,
        content: contentDiv
      });
      container.appendChild(accordionItem);
    });
  };
  
  const renderPropertyDetails = (dataElements, extensions, searchKeyword, container) => {
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
        detailsSpan.className = "text-sm text-gray-500";
        detailsSpan.textContent = `(Rev: ${rev}, ${published}, ${enabled})`;
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
        detailsSpan.className = "text-sm text-gray-500";
        detailsSpan.textContent = `(Rev: ${rev}, ${published}, ${enabled})`;
        const contentDiv = document.createElement('div');
        if (UIUtils.showAttributesEnabled() && ext.attributes) {
          contentDiv.appendChild(UIUtils.renderAttributesTable(ext.attributes));
        }
        if (ext.attributes.settings) {
          let settingsTitle = "Settings";
          if (ext.attributes.delegate_descriptor_id) {
            //settingsTitle += ` [${ext.attributes.delegate_descriptor_id}]`;
          }
          const settingsSection = UIUtils.createSection(settingsTitle);
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
  
  return {
    init
  };
})();

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', AppController.init);
