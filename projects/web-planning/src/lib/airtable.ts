function getAirtableConfig() {
  const airtableBase = process.env.AIRTABLE_BASE_ID;
  const airtableToken = process.env.AIRTABLE_TOKEN;

  if (!airtableBase || !airtableToken) {
    throw new Error("Missing Airtable env vars");
  }

  return { airtableBase, airtableToken };
}

export async function airtableUpsert(table: string, fields: Record<string, unknown>) {
  const { airtableBase, airtableToken } = getAirtableConfig();
  const response = await fetch(`https://api.airtable.com/v0/${airtableBase}/${table}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${airtableToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields }] }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Airtable error: ${response.status} ${text}`);
  }

  return response.json();
}
