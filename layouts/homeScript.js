import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseconfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



document.getElementById("search-button").addEventListener("click", async function(e){
    e.preventDefault();
    const vehicle = document.getElementById("vehicle-input").value.trim();
   try {
    const parts = await fetchCompatibleParts(vehicle);

    if (parts.length === 0) {
      alert("No compatible parts found.");
    } else {
      const message = parts.map(part => 
        `• ${part.partName || part.part_name || part.id}`
        
      ).join('\n');
          // save the data temp
        localStorage.setItem("partsResults", JSON.stringify(parts));
        // parse the data to result 
        window.location.href = "result.html";
        /*
        console.log("✅ Compatible Parts:", parts);
        parts.forEach(part => {
        console.log(" Part Name:", part.partName);
        console.log(" OEM Part Number:", part.oem_part_number);
        console.log(" Price Range: $", part.price_from, "-", part.price_to);
        console.log(" Year Range:", part.year_from, "-", part.year_to);
        console.log(" Compatible Trims:", part.compatible_trims.join(", "));
        console.log(" Compatible Years:", part.compatible_years.join(", "));
        console.log("-----------------------------------");
        
    });
    */
    }

  } catch (err) {
    alert("Error fetching parts: " + err.message);
  }
});

export async function fetchCompatibleParts(vehicleInput) {
  try {
    const parts = vehicleInput.trim().split(/\s+/);

    if (parts.length < 4) throw new Error("Please enter Year Make Model Trim.");

    const year = parseInt(parts[0]);
    const make = parts[1].toLowerCase();
    const model = parts[2];
    const trim = parts.slice(3).join(" ").toUpperCase();

    const makeModelKey = make + model.charAt(0).toUpperCase() + model.slice(1).toLowerCase();

    const modelRef = doc(db, "make_model_parts", makeModelKey);
    const partsRef = collection(modelRef, "parts");

    const snapshot = await getDocs(partsRef);

    const compatibleParts = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const { compatible_years = [], compatible_trims = [] } = data;

      if (
        compatible_years.includes(year) &&
        compatible_trims.includes(trim)
      ) {
        compatibleParts.push({ id: docSnap.id, ...data });
      }
    });

    return compatibleParts;
  } catch (err) {
    console.error("❌ Error fetching parts:", err);
    throw err;
  }
}