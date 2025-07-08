document.getElementById("search-button").addEventListener("click", async () => {
  const input = document.getElementById("vehicle-input").value.trim();
  if (!input) {
    alert("Please enter vehicle information.");
    return;
  }

  try {
    const response = await fetch("/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ vehicle: input })
    });

    const data = await response.json();

    if (response.ok) {
      if (data.length === 0) {
        showAlert("Sorry, no compatible parts found for this vehicle.");
      } else {
        // Store the result and redirect
        localStorage.setItem("partsResult", JSON.stringify(data));
        window.location.href = "/result";
      }
    } else {
      alert(data.error || "Failed to search parts.");
    }
  } catch (error) {
    console.error("Error during fetch:", error);
    alert("Something went wrong.");
  }
});



function showAlert(message) {
  const container = document.getElementById("alertBoxContainer");
  container.innerHTML = `
    <div id="alertBox" style="background: #f8d7da; width: 230px; color: #721c24; padding: 10px;  border: 1px solid #f5c6cb; border-radius: 5px; position: relative;">
      ${message}
      <span onclick="document.getElementById('alertBox').style.display='none'" style="position: absolute; right: 10px; top: 5px; cursor: pointer;">&times;</span>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const laborBtn = document.getElementById("labor-button");
  if (laborBtn) {
    laborBtn.addEventListener("click", () => {
      window.location.href = "/laborCost";
    });
  }
});
/*
const input = document.getElementById("vehicle-input");

input.addEventListener("input", async function () {
  const query = input.value.trim();
  if (query.length < 2) return;

  const res = await fetch("/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const suggestions = await res.json();
  showSuggestions(suggestions);
});

function showSuggestions(list) {
  let container = document.getElementById("suggestions");
  if (!container) {
    container = document.createElement("ul");
    container.id = "suggestions";
    container.style.position = "absolute";
    container.style.background = "#fff";
    container.style.border = "1px solid #ccc";
    container.style.width = "250px";
    container.style.zIndex = "999";
    input.parentElement.appendChild(container);
  }

  container.innerHTML = "";
  list.forEach(s => {
    const item = document.createElement("li");
    item.textContent = s;
    item.style.padding = "8px";
    item.style.cursor = "pointer";
    item.onclick = () => {
      input.value = s;
      container.innerHTML = "";
    };
    container.appendChild(item);
  });
}
*/