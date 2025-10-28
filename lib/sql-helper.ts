import { pool } from './db';

// Helper to make pool.query work like sql`` template tag
export async function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  // Build parameterized query
  let query = '';
  for (let i = 0; i < strings.length; i++) {
    query += strings[i];
    if (i < values.length) {
      query += `$${i + 1}`;
    }
  }

  const result = await pool.query(query, values);
  return {
    rows: result.rows,
    rowCount: result.rowCount,
  };
}

// Add query method for compatibility
sql.query = async (query: string, values: unknown[]) => {
  const result = await pool.query(query, values);
  return {
    rows: result.rows,
    rowCount: result.rowCount,
  };
};
