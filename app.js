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
