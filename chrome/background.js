async function showLoadingModal(tab, text) {
  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    css: `
      .fact-check-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
      }
      
      .fact-check-modal {
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }

      .fact-check-loading {
        text-align: center;
        padding: 20px;
      }

      .fact-check-spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
        margin: 10px auto;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `,
  });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (selectedText) => {
      const modal = document.createElement("div");
      modal.id = "fact-check-overlay";
      modal.className = "fact-check-overlay";
      modal.innerHTML = `
        <div class="fact-check-modal">
          <div class="fact-check-loading">
            <div class="fact-check-spinner"></div>
            <h3>Fact checking the following:</h3>
            <p style="white-space: pre-wrap;">${selectedText}</p>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    },
    args: [text],
  });
}

async function showResults(tab, data) {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (responseData) => {
      const overlay = document.getElementById("fact-check-overlay");
      const modal = overlay.querySelector(".fact-check-modal");

      modal.innerHTML = `
        <div style="position: relative;">
          <div style="position: absolute; top: 10px; right: 10px; cursor: pointer; font-size: 20px;" onclick="document.getElementById('fact-check-overlay').remove()">&times;</div>
          
          <div class="section">
            <div class="section-title">Original Text:</div>
            <div style="white-space: pre-wrap;">${
              responseData.original_query
            }</div>
          </div>

          <div class="section">
            <div class="section-title">Summary:</div>
            <div>${responseData.summarized_query}</div>
          </div>

          <div class="section">
            <div class="section-title">Analysis:</div>
            <div class="${
              responseData.factuality_analysis.is_factual
                ? "factual"
                : "not-factual"
            }">
              Verdict: ${
                responseData.factuality_analysis.is_factual
                  ? "Factual"
                  : "Not Factual"
              }
            </div>
            <div>Confidence: ${(
              responseData.factuality_analysis.confidence * 100
            ).toFixed(1)}%</div>
            <div>Reasoning: ${responseData.factuality_analysis.reasoning}</div>
          </div>

          <div class="section">
            <div class="section-title">Sources:</div>
            ${responseData.search_results.sources
              .map(
                (source) => `
              <div class="source">
                <a href="${source.url}" target="_blank" class="source-link">${source.url}</a>
                <p>${source.content}</p>
              </div>
            `
              )
              .join("<hr>")}
          </div>
        </div>
      `;

      // Click outside to close
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
      };
    },
    args: [data],
  });
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "process-selection") {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        throw new Error("No active tab found");
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString().trim() || "",
      });

      const selectedText = results[0]?.result;
      if (!selectedText) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon48.png",
          title: "Error",
          message: "Please select some text first",
        });
        return;
      }

      // Show loading state
      await showLoadingModal(tab, selectedText);

      // Call API
      const response = await fetch("http://localhost:3001/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: selectedText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Show results
      await showResults(tab, data);
    } catch (error) {
      console.error("Error:", error);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "Error",
        message: `Error: ${error.message}`,
      });
    }
  }
});
