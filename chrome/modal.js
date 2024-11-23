// Receive data from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message)
  if (message.type === "API_RESPONSE") {
    const data = message.data;

    // Update original query
    document.getElementById("original-query").textContent = data.query;

    // Update supporting evidence
    const supportingDiv = document.getElementById("supporting-evidence");
    supportingDiv.innerHTML = `
      <div class="fact-check-analysis ${data.supporting_evidence.is_factual ? "factual" : "not-factual"}">
        Verdict: ${data.supporting_evidence.is_factual ? "Factual" : "Not Factual"}
      </div>
      <div><strong>Confidence:</strong> ${(data.supporting_evidence.confidence * 100).toFixed(1)}%</div>
      <div><strong>Reasoning:</strong> ${data.supporting_evidence.reasoning}</div>
      <div class="fact-check-section">
        <div class="fact-check-heading">Sources</div>
        <div class="fact-check-sources">
          ${data.supporting_evidence.sources.map(source => `
            <div class="fact-check-source">
              <a href="${source.url}" target="_blank" class="fact-check-source-link">
                ${source.url}
              </a>
              <p>${source.content}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // Update opposing evidence
    const opposingDiv = document.getElementById("opposing-evidence");
    opposingDiv.innerHTML = `
      <div class="fact-check-analysis ${data.opposing_evidence.is_factual ? "factual" : "not-factual"}">
        Verdict: ${data.opposing_evidence.is_factual ? "Factual" : "Not Factual"}
      </div>
      <div><strong>Confidence:</strong> ${(data.opposing_evidence.confidence * 100).toFixed(1)}%</div>
      <div><strong>Reasoning:</strong> ${data.opposing_evidence.reasoning}</div>
      <div class="fact-check-section">
        <div class="fact-check-heading">Sources</div>
        <div class="fact-check-sources">
          ${data.opposing_evidence.sources.map(source => `
            <div class="fact-check-source">
              <a href="${source.url}" target="_blank" class="fact-check-source-link">
                ${source.url}
              </a>
              <p>${source.content}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }
});
