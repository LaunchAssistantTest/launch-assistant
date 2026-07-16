// Config module for managing API credentials and authentication
export const ConfigManager = (function() {
  // Fixed for this deployment: this app's own Adobe Developer Console
  // registration and the single Adobe org it's licensed to call the
  // Experience Platform Launch API for. Neither is secret — they just
  // identify "which app" and "which org", not a per-user identity.
  const ADOBE_CLIENT_ID = "d7b3880b744a40fb84c9c6033fba5527";
  const ADOBE_ORG_ID = "8CC867C25245ADC30A490D4C@AdobeOrg";

  const ACCESS_TOKEN_KEY = 'accessToken';

  let config = {
    accessToken: "",
    orgId: ADOBE_ORG_ID,
    clientId: ADOBE_CLIENT_ID
  };

  // Load a stored access token from sessionStorage
  const loadStoredSettings = () => {
    const storedValue = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (storedValue) {
      document.getElementById('accessToken').value = storedValue;
      config.accessToken = storedValue;
    }
  };

  // Update config from form inputs
  const updateFromForm = () => {
    config.accessToken = document.getElementById('accessToken').value.trim();
    return isConfigComplete();
  };

  // Save the access token to sessionStorage
  const saveToStorage = () => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, config.accessToken);
  };

  // Check if the config is usable
  const isConfigComplete = () => {
    return config.accessToken.trim() !== "";
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
