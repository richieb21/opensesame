chrome.commands.onCommand.addListener(async (command) => {
  if (command === "process-selection") {
    try {
      // Get the active tab
      console.log("Processing selection");
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        throw new Error("No active tab found");
      }

      // Execute script to get selected text
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const selection = window.getSelection();
          const selectedText = selection?.toString().trim() || "";
          console.log("Selected text in page:", selectedText);
          return selectedText;
        },
      });

      // Check if we got text
      const selectedText = results[0]?.result;
      console.log("Selected text in background:", selectedText);

      if (!selectedText) {
        console.log("No text selected");
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon48.png",
          title: "Error",
          message: "Please select some text first",
        });
        return;
      }

      await callAPI(selectedText);
    } catch (error) {
      console.error("Error:", error);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "Error",
        message: `Failed to get selected text: ${error.message}`,
      });
    }
  }
});

async function callAPI(text) {
  const requestBody = {
    query: text,
  };
  try {
    const response = await fetch("http://localhost:3001/invoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon48.png",
      title: "Success",
      message: "Text processed successfully!",
    });
  } catch (error) {
    console.error("API Error:", error);
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon48.png",
      title: "Error",
      message: `Failed to process text: ${error.message}`,
    });
  }
}
