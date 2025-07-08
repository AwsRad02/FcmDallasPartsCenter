
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc,updateDoc,arrayUnion,collection } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseconfig.js";

  
  
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById('check-btn').addEventListener('click',async function (e) {
  
    e.preventDefault();
      handleCheckBtn();

  });


  async function handleCheckBtn() {
      const fullText=document.getElementById('db-check').value.trim();
      const splitedText=fullText.split(" ");
      if(splitedText.length<4){
        alert("Please enter: Year Make Model Trim");
        return;
        }
  
      const year = splitedText[0];
      const make = splitedText[1];
      const model = splitedText[2];
      const trim = splitedText[3];
  
      const id = `${year} ${make} ${model} ${trim}`;
  
      const data = {
        id,
        year,
        make,
        model,
        trim 
      };
  
      const docRef = doc(db, "added-vehicles", id);
  
      try {
          const docSnapShot= await getDoc(docRef);
          if(docSnapShot.exists()){
              alert(" Already added to the database.");
          }else{
                  await setDoc(doc(db, "added-vehicles", id), data);
                  alert("✅ Data uploaded successfully!");
                  console.log("Uploaded:");
  
          }
  
        } catch (error) {
          console.error("❌ Upload failed:", error);
          alert("Upload failed: " + error.message);
        }
      
    }
  


document.getElementById('submit').addEventListener("click", async (e) => {
  e.preventDefault();
  

  //shared inputs ---
  const makeModel=document.getElementById("make-model-trim")?.value.trim();
  const trimInput=document.getElementById("trim")?.value.trim();
  const make=GetModelMake(makeModel);
  const trim=formatTrimUpload(trimInput);

   if (!makeModel || !trim) {
    alert("Make/Model and Trim are required.");
    return;
  }
  const compatibleTrims=[trim];
  // DOM row collection
  
  const allPartRows = document.querySelectorAll('.parts-section .part-row');
  const allPartsData = [];
  let isValid = true;

  allPartRows.forEach(row => {
    const label = row.querySelector('label')?.textContent.trim();

    const inputs = Array.from(row.querySelectorAll('input')); // Convert NodeList to Array
    const values = inputs.map(input => input.value.trim());
    const allEmpty = values.every(val => val === '');  // Check if all fields are empty
    const allFilled = values.every(val => val !== ''); // Check if all fields are filled

    // Reset styles
    inputs.forEach(input => {
      input.classList.remove('error-shake');
      input.style.borderColor = '';
    });

    // If the row is completely empty, skip it
    if (allEmpty) return;

    // If the row is partially filled (not all fields are filled), show the error
    if (!allFilled) {
      isValid = false;
      inputs.forEach(input => {
        if (!input.value.trim()) {
          input.classList.add('error-shake');
          input.style.borderColor = 'red';
        }
      });
      return;
    }
    
    const part = label.toLowerCase().replace(/\s+/g, '_');

    // If all fields are filled, push the row data to the list
    if (allFilled) {
        const[priceFromStr,priceToStr,partNumber,yearFromStr,yearToStr]=values;
          const priceFrom = parseFloat(priceFromStr);
          const priceTo = parseFloat(priceToStr);
          const yearFrom = parseInt(yearFromStr);
          const yearTo = parseInt(yearToStr);

          //VALIDATE INPUT
        
        if (
            isNaN(priceFrom) || isNaN(priceTo) ||
            isNaN(yearFrom) || isNaN(yearTo) ||
            yearFrom > yearTo ||
            priceFrom > priceTo) {
              isValid = false;
              alert(`Invalid input in row for "${label}". Check numbers and logical ranges.`);
              return;
            }
        const partId = toSnakeCase(label);

            allPartsData.push({
              make,
              trim,
              part: partId,
              part_name: label,
              priceFrom,
              priceTo,
              partNumber,
              yearFrom,
              yearTo,
              compatibleTrims
            });

          }
      });
  

  if (!isValid) {
    alert("Please complete all fields in any partially filled row.");
    return;
  }

  console.log("✅ Data ready to upload:", allPartsData);
  //firebase logic

  try {
  await uploadPartsData(allPartsData);
  alert("✅ Parts uploaded successfully!");
} catch (err) {
  console.error("❌ Upload failed:", err);
  alert("Upload failed: " + err.message);
}
});

function generateYearRange(yearFrom, yearTo) {
  const years = [];
  for (let year = yearFrom; year <= yearTo; year++) {
    years.push(year);
  }
  return years;
}



async function uploadPartsData(data) {
  const makeModelPartsRef = collection(db, "make_model_parts");

  for (const partData of data) {
    const {
      make, part, priceFrom, priceTo,
      partNumber, part_name,
      yearFrom, yearTo,
      compatibleTrims, trim
    } = partData;

    const compatibleYears = generateYearRange(parseInt(yearFrom), parseInt(yearTo));
    const modelRef = doc(makeModelPartsRef, make);
    const partsRef = collection(modelRef, "parts");
    //part number as a unique id
    const partRef = doc(partsRef, partNumber);

    const partDataToSave = {
      partName: part_name,
      oem_part_number: partNumber,
      trim,
      year_from: yearFrom,
      year_to: yearTo,
      price_from: priceFrom,
      price_to: priceTo,
      compatible_years: compatibleYears,
      compatible_trims: compatibleTrims
    };

    try {
      const docSnapshot = await getDoc(partRef);

      if (docSnapshot.exists()) {
        const existingData = docSnapshot.data();

        // دمج الذكي للـ arrays (مع إزالة التكرار)
        const updatedTrims = Array.from(new Set([
          ...(existingData.compatible_trims || []),
          ...compatibleTrims
        ]));

        const updatedYears = Array.from(new Set([
          ...(existingData.compatible_years || []),
          ...compatibleYears
        ]));

        await updateDoc(partRef, {
          compatible_trims: updatedTrims,
          compatible_years: updatedYears,
          price_from: priceFrom,
          price_to: priceTo,
        });

        console.log(`🔄 Updated part ${partNumber} for ${make}`);
      } else {
        await setDoc(partRef, partDataToSave);
        console.log(`✅ Created part ${partNumber} for ${make}`);
      }
    } catch (error) {
      console.error(`❌ Error with part ${partNumber} for ${make}:`, error);
    }
  }
}

function GetModelMake(rawInput) {
  const parts = rawInput.trim().split(/\s+/);

  // Remove the year if the first word is numeric
  if (!isNaN(parts[0])) {
    parts.shift();
  }

  if (parts.length < 2) {
    throw new Error("❌ Invalid input. Please enter at least Make and Model.");
  }

  const [make, ...modelParts] = parts;

  if (!make) throw new Error("❌ Make is missing in input.");

  const modelCamel = modelParts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  const makeLower = make.toLowerCase();

  return makeLower + modelCamel;
}



function toSnakeCase(str) {
  return str.trim().toLowerCase().replace(/\s+/g, "_");
}

function formatTrimUpload(trimInput) {
  return trimInput.trim().toUpperCase().replace(/\s+/g, ' ');
}
