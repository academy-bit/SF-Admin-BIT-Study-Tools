// sheetLoader.js

// Published CSV links for each sheet
const SHEET_URLS = {
  Tab1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJxKM7J9Y95fgcq2fQuZORzDLMXXbCGLD7iyt8a4VOb0Dwq4CF_aoSLAyJaZIu-pGnamYjEkduzq01/pub?gid=0&single=true&output=csv",
  Tab2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJxKM7J9Y95fgcq2fQuZORzDLMXXbCGLD7iyt8a4VOb0Dwq4CF_aoSLAyJaZIu-pGnamYjEkduzq01/pub?gid=1322991689&single=true&output=csv",
  Tab3: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJxKM7J9Y95fgcq2fQuZORzDLMXXbCGLD7iyt8a4VOb0Dwq4CF_aoSLAyJaZIu-pGnamYjEkduzq01/pub?gid=1764686075&single=true&output=csv",
  Tab4: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJxKM7J9Y95fgcq2fQuZORzDLMXXbCGLD7iyt8a4VOb0Dwq4CF_aoSLAyJaZIu-pGnamYjEkduzq01/pub?gid=228918049&single=true&output=csv",
};

const HEADER_ROWS_TO_SKIP = 1; // skip header row

// Optional topics filter
export const TOPICS = ["Topic 1", "Topic 2", "Topic 3"];

// CSV parser
function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index++) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"' && insideQuotes && nextCharacter === '"') {
      value += '"';
      index++;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") index++;
      row.push(value);
      value = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }

    value += character;
  }

  if (value !== "" || row.length > 0) {
    row.push(value);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }

  return rows;
}

// Validate row
function isValidCardRow(row) {
  return (
    Array.isArray(row) &&
    row.length >= 2 &&
    String(row[0]).trim() !== "" &&
    String(row[1]).trim() !== ""
  );
}

// Loader for each sheet
export async function loadSheetCards(sheetName) {
  const csvUrl = SHEET_URLS[sheetName];
  if (!csvUrl) throw new Error(`No URL found for ${sheetName}`);

  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error(`Unable to load sheet: ${sheetName}`);

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  return rows
    .slice(HEADER_ROWS_TO_SKIP)
    .filter(isValidCardRow)
    .map(([front, back]) => ({
      front: String(front).trim(),
      back: String(back).trim(),
    }));
}
