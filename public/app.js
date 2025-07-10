document
  .getElementById("indexingForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const urlsTextarea = document.getElementById("urls");
    const submitBtn = document.getElementById("submitBtn");
    const loading = document.getElementById("loading");
    const results = document.getElementById("results");
    const resultsContent = document.getElementById("resultsContent");

    // Get URLs and clean them
    const urlsText = urlsTextarea.value.trim();
    if (!urlsText) {
      alert("Please enter at least one URL");
      return;
    }

    const urls = urlsText
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      alert("Please enter at least one valid URL");
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";
    loading.classList.add("show");
    results.classList.remove("show");

    // Clear previous results
    resultsContent.innerHTML = "";

    try {
      // Make streaming request
      const response = await fetch("/api/index/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start processing");
      }

      // Show results container
      results.classList.add("show");

      // Process the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));

              // Handle different event types based on the data structure
              if (data.url) {
                // This is a result for a specific URL
                addResultItem(data);
              } else if (data.total !== undefined) {
                // This is the summary
                updateSummary(data);
              } else if (data.message) {
                // This is a status message
                console.log("Status:", data.message);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          } else if (line.startsWith("event: complete")) {
            console.log("Processing completed");
            break;
          }
        }
      }

      // Hide loading
      loading.classList.remove("show");
    } catch (error) {
      loading.classList.remove("show");
      alert("Error: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "🚀 Submit URLs for Indexing";
    }
  });

function addResultItem(result) {
  const resultsContent = document.getElementById("resultsContent");
  const isSuccess = result.success;

  const resultDiv = document.createElement("div");
  resultDiv.className = `result-item ${isSuccess ? "" : "error"}`;
  resultDiv.innerHTML = `
    <div class="result-url">${result.url}</div>
    <div class="result-status ${isSuccess ? "success" : "error"}">
      ${isSuccess ? "✅ Success" : "❌ " + result.error}
    </div>
  `;

  resultsContent.appendChild(resultDiv);
}

function updateSummary(summary) {
  const resultsContent = document.getElementById("resultsContent");

  // Remove existing summary if any
  const existingSummary = resultsContent.querySelector(".summary");
  if (existingSummary) {
    existingSummary.remove();
  }

  // Add new summary
  const summaryDiv = document.createElement("div");
  summaryDiv.className = "summary";
  summaryDiv.innerHTML = `
    <strong>📈 Summary:</strong> 
    ${summary.successful} successful, 
    ${summary.failed} failed, 
    ${summary.total} total
  `;

  resultsContent.appendChild(summaryDiv);
}
