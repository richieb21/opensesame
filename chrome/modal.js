// Receive data from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "API_RESPONSE") {
    const data = message.data;

    // Update original query
    document.getElementById("original-query").textContent = data.original_query;

    // Update summary
    document.getElementById("summarized-query").textContent =
      data.summarized_query;

    // Update factuality analysis
    const factualityDiv = document.getElementById("factuality-result");
    factualityDiv.textContent = `Verdict: ${
      data.factuality_analysis.is_factual ? "Factual" : "Not Factual"
    }`;
    factualityDiv.className = data.factuality_analysis.is_factual
      ? "factual"
      : "not-factual";

    document.getElementById("confidence").textContent = `Confidence: ${(
      data.factuality_analysis.confidence * 100
    ).toFixed(1)}%`;

    document.getElementById(
      "reasoning"
    ).textContent = `Reasoning: ${data.factuality_analysis.reasoning}`;

    // Update sources
    const sourcesDiv = document.getElementById("sources");
    sourcesDiv.innerHTML = data.search_results.sources
      .map(
        (source) => `
          <div class="source">
            <a href="${source.url}" target="_blank" class="source-link">${source.url}</a>
            <p>${source.content}</p>
          </div>
        `
      )
      .join("<hr>");
  }
});
