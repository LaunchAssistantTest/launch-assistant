// Controller for handling the app's business logic
import { ConfigManager } from './config.js';
import { APIService } from './api.js';
import { UIUtils } from './ui.js';
import { renderResults } from './render.js';
import { downloadExcel } from './excel.js';

const AppController = (function() {
  let latestResults = {
    rules: [],
    dataElements: [],
    extensions: [],
    searchKeyword: ""
  };

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
    document.getElementById('downloadExcelBtn').addEventListener('click', handleDownloadExcel);
    document.getElementById('searchQuery').addEventListener('keydown', (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = e.target.value.trim();
        if (query !== "") {
          handleSearch();
        } else {
          handleGetDetails();
        }
      }
    });
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
      await APIService.attachRuleComponents(rules);
      const dataElements = await APIService.getDataElements(propertyId);
      const extensionsData = await APIService.getExtensions(propertyId);
      const extensions = extensionsData.data || [];
      latestResults = {
        rules,
        dataElements,
        extensions,
        searchKeyword: query
      };
      renderResults(rules, dataElements, extensions, query);
      toggleExcelDownloadButton(true);
    } catch (error) {
      console.error("Error in Get Details:", error);
      alert("An error occurred while fetching details. Please check the console for more information.");
      toggleExcelDownloadButton(false);
    } finally {
      UIUtils.toggleLoading(false);
    }
  };

  const toggleExcelDownloadButton = (show) => {
    const button = document.getElementById('downloadExcelBtn');
    if (button) {
      button.classList.toggle('hidden', !show);
    }
  };

  const handleDownloadExcel = () => {
    downloadExcel(latestResults, {
      companySelectEl: document.getElementById('companySelect'),
      propertySelectEl: document.getElementById('propertySelect')
    });
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

  return {
    init
  };
})();

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', AppController.init);
