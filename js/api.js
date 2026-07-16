// API service for handling all API requests
import { ConfigManager } from './config.js';

// Run async tasks with a concurrency cap instead of one at a time or all at once
export const mapWithConcurrency = async (items, limit, fn) => {
  const results = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await fn(items[currentIndex], currentIndex);
    }
  };

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
};

export const APIService = (function() {
  const API_BASE_URL = "https://reactor.adobe.io";
  const cache = {};

  // Generic fetch function with caching and error handling
  const fetchAPI = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const cacheKey = `${url}:${JSON.stringify(options)}`;

    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    const defaultOptions = {
      method: "GET",
      headers: ConfigManager.getAuthHeaders()
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      cache[cacheKey] = data;
      return data;
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

  const RULE_COMPONENT_FETCH_CONCURRENCY = 6;

  // Fetch and attach components for each rule, several rules at a time instead of one at a time
  const attachRuleComponents = async (rules) => {
    await mapWithConcurrency(rules, RULE_COMPONENT_FETCH_CONCURRENCY, async (rule) => {
      const componentData = await fetchAPI(`/rules/${rule.id}/rule_components`);
      rule.components = componentData.data || [];
    });
    return rules;
  };

  return {
    getCompanies: () => fetchAPI("/companies"),
    getProperties: (companyId) => fetchAPI(`/companies/${companyId}/properties`),
    getRules: (propertyId) => fetchAllPages(`/properties/${propertyId}/rules`),
    getDataElements: (propertyId) => fetchAllPages(`/properties/${propertyId}/data_elements`),
    getRuleComponents: (ruleId) => fetchAPI(`/rules/${ruleId}/rule_components`),
    getExtensions: (propertyId) => fetchAPI(`/properties/${propertyId}/extensions`),
    attachRuleComponents
  };
})();
