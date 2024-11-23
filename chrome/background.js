chrome.commands.onCommand.addListener(async (command) => {
  if (command === "process-selection") {
    // Get the active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Execute script to get selected text
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        function: getSelectedText,
      },
      async (results) => {
        const selectedText = results[0].result;
        if (selectedText) {
          callAPI(selectedText);
        }
      }
    );
  }
});

function getSelectedText() {
  return window.getSelection().toString();
}

async function callAPI(text) {
  console.log(text);
  try {
    const response = await fetch("YOUR_API_ENDPOINT", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text }),
    });

    const data = await response.json();
    // Handle the API response here
    console.log("API Response:", data);

    // Optional: Show a notification with the result
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon48.png",
      title: "API Response",
      message: "Text processed successfully!",
    });
  } catch (error) {
    console.error("API Error:", error);
  }
}
