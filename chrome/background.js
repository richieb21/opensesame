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
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        backdrop-filter: blur(3px);
      }
      
      .fact-check-modal {
        background: white;
        padding: 30px;
        border-radius: 12px;
        width: 90%;
        max-width: 700px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 4px 24px rgba(0,0,0,0.2);
        position: relative;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .fact-check-close {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 30px;
        height: 30px;
        border-radius: 15px;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 20px;
        color: #666;
        transition: all 0.2s ease;
      }

      .fact-check-close:hover {
        background: #e0e0e0;
        color: #333;
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
          <div class="fact-check-close" onclick="document.getElementById('fact-check-overlay').remove()">&times;</div>
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
  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    css: `
      .fact-check-section {
        margin-top: 24px;
      }

      .fact-check-section:first-child {
        margin-top: 0;
      }

      .fact-check-heading {
        font-size: 1.2em;
        font-weight: 700;
        color: #333;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e0e0e0;
      }

      .fact-check-source {
        padding: 8px 0;
      }

      .fact-check-source-link {
        color: #2196F3;
        text-decoration: none;
        font-weight: 500;
      }

      .fact-check-source-link:hover {
        text-decoration: underline;
      }
    `,
  });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (responseData) => {
      const overlay = document.getElementById("fact-check-overlay");
      const modal = overlay.querySelector(".fact-check-modal");

      modal.innerHTML = `
        <div style="position: relative;">
          <div class="fact-check-close" onclick="document.getElementById('fact-check-overlay').remove()">&times;</div>
          
          <div class="fact-check-section">
            <div class="fact-check-heading">Original Text</div>
            <div style="white-space: pre-wrap;">${
              responseData.original_query
            }</div>
          </div>

          ${
            responseData.summarized_query
              ? `
            <div class="fact-check-section">
              <div class="fact-check-heading">Summary</div>
              <div>${responseData.summarized_query}</div>
            </div>
          `
              : ""
          }

          <div class="fact-check-section">
            <div class="fact-check-heading">Analysis</div>
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
            <div style="margin-top: 8px;">
              <strong>Confidence:</strong> ${(
                responseData.factuality_analysis.confidence * 100
              ).toFixed(1)}%
            </div>
            <div style="margin-top: 8px;">
              <strong>Reasoning:</strong> ${
                responseData.factuality_analysis.reasoning
              }
            </div>
          </div>

          <div class="fact-check-section">
            <div class="fact-check-heading">Sources</div>
            <div class="fact-check-sources">
              ${responseData.search_results.sources
                .map(
                  (source) => `
                  <div class="fact-check-source">
                    <a href="${source.url}" target="_blank" class="fact-check-source-link">
                      ${source.url}
                    </a>
                  </div>
                `
                )
                .join("")}
            </div>
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

// Add new CSS for the transcription panel
async function injectTranscriptionPanelCSS(tab) {
  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    css: `
      .transcription-panel {
        position: fixed;
        right: 0;
        top: 0;
        width: 300px;
        height: 100vh;
        background: white;
        box-shadow: -2px 0 10px rgba(0,0,0,0.1);
        z-index: 999998;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        overflow-y: auto;
      }

      .transcription-panel-header {
        font-size: 1.2em;
        font-weight: 700;
        color: #333;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .transcription-close {
        cursor: pointer;
        font-size: 20px;
        color: #666;
        transition: color 0.2s ease;
      }

      .transcription-close:hover {
        color: #333;
      }

      .transcription-content {
        white-space: pre-wrap;
        line-height: 1.5;
        color: #444;
      }
    `,
  });
}

// Function to show transcription panel
async function showTranscriptionPanel(tab) {
  await injectTranscriptionPanelCSS(tab);

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Remove existing panel if it exists
      const existingPanel = document.querySelector(".transcription-panel");
      if (existingPanel) {
        existingPanel.remove();
        return;
      }

      // Create new panel
      const panel = document.createElement("div");
      panel.className = "transcription-panel";
      panel.innerHTML = `
        <div class="transcription-panel-header">
          <span>Live Transcription</span>
          <span class="transcription-close" onclick="this.closest('.transcription-panel').remove()">&times;</span>
        </div>
        <div class="transcription-content"></div>
      `;
      document.body.appendChild(panel);

      // Start polling for transcription
      const updateTranscription = async () => {
        try {
          const response = await fetch(
            "http://localhost:3002/api/transcription"
          );
          if (!response.ok) throw new Error("Failed to fetch transcription");
          const data = await response.json();
          const content = panel.querySelector(".transcription-content");
          content.textContent =
            data.transcription || "No transcription available";
        } catch (error) {
          console.error("Transcription error:", error);
        }
      };

      // Initial fetch
      updateTranscription();

      // Set up polling interval
      const intervalId = setInterval(updateTranscription, 15000);

      // Store interval ID for cleanup
      panel.dataset.intervalId = intervalId;
    },
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
      console.log("Data:", data);
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
  } else if (command === "show-transcription") {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) throw new Error("No active tab found");
      await showTranscriptionPanel(tab);
    } catch (error) {
      console.error("Error showing transcription:", error);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "Error",
        message: `Error showing transcription: ${error.message}`,
      });
    }
  }
});
