const SPREADSHEET_ID =
  "1BvC0hMU60P35PTg9ns_4sOfwmS9DQJvSXhcRYF1URI0";

/*
  Your spreadsheet structure is:

  Sheet 1 → Tab 1
  Sheet 2 → Tab 2
  Sheet 3 → Tab 3
  Sheet 4 → Tab 4
*/

const SHEETS = [
  {
    gid: "0", // Sheet1
    name: "Tab 1",
  },
  {
    gid: "1322991689", // Sheet2
    name: "Tab 2",
  },
  {
    gid: "1764686075", // Sheet3
    name: "Tab 3",
  },
  {
    gid: "228918049", // Sheet4
    name: "Tab 4",
  },
];

export const TOPICS = SHEETS.map((sheet) => sheet.name);

/**
 * Creates the CSV URL for one worksheet.
 */
function createSheetCsvUrl(gid) {
  return (
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}` +
    `/export?format=csv&gid=${gid}`
  );
}

/**
 * Parse CSV text.
 */
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
      if (row.some((cell) => String(cell).trim() !== "")) rows.push(row);
      row = [];
      continue;
    }

    value += character;
  }

  if (value !== "" || row.length > 0) {
    row.push(value);
    if (row.some((cell) => String(cell).trim() !== "")) rows.push(row);
  }

  return rows;
}

/**
 * Find the worksheet configuration from the topic name.
 */
function getSheetByTopic(topic) {
  return SHEETS.find((sheet) => sheet.name === topic);
}

/**
 * Check if a row contains a valid flashcard.
 */
function isValidCardRow(row) {
  return (
    Array.isArray(row) &&
    row.length >= 2 &&
    String(row[0]).trim() !== "" &&
    String(row[1]).trim() !== ""
  );
}

/**
 * Load flashcards from one Google Sheet worksheet.
 */
export async function loadTopicCards(topic) {
  const sheet = getSheetByTopic(topic);

  if (!sheet) {
    throw new Error(`Topic "${topic}" was not found.`);
  }

  const csvUrl = createSheetCsvUrl(sheet.gid);
  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error(`Unable to load ${topic}.`);
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  // Skip first two rows (tab title + headers)
  return rows
    .slice(2)
    .filter(isValidCardRow)
    .map(([front, back]) => ({
      front: String(front).trim(),
      back: String(back).trim(),
    }));
}
