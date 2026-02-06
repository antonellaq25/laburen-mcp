import * as XLSX from 'xlsx';
import * as fs from 'node:fs';
import * as path from 'node:path';

const XLSX_PATH = path.join(__dirname, '..', 'data', 'products.xlsx');
const OUTPUT_PATH = path.join(__dirname, '..', 'seeds', 'seed.sql');

function escapeSQL(value: string): string {
  return value.replace(/'/g, "''");
}

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`File not found: ${XLSX_PATH}`);
    console.error('Place your products.xlsx file in the data/ directory.');
    process.exit(1);
  }

  const workbook = XLSX.readFile(XLSX_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  if (rows.length === 0) {
    console.error('No data found in the spreadsheet.');
    process.exit(1);
  }

  let sql = '-- Auto-generated seed data from products.xlsx\n';
  sql += `-- Generated at: ${new Date().toISOString()}\n\n`;
  sql += 'DELETE FROM cart_items;\n';
  sql += 'DELETE FROM carts;\n';
  sql += 'DELETE FROM products;\n\n';

  for (const row of rows) {
    const id = parseInt(String(row['ID'] ?? '0'), 10);
    const tipoPrenda = escapeSQL(String(row['TIPO_PRENDA'] ?? ''));
    const talla = escapeSQL(String(row['TALLA'] ?? ''));
    const color = escapeSQL(String(row['COLOR'] ?? ''));
    const name = escapeSQL(`${row['TIPO_PRENDA']} ${row['TALLA']} ${row['COLOR']}`);
    const stock = parseInt(String(row['CANTIDAD_DISPONIBLE'] ?? '0'), 10);
    const precio50 = parseFloat(String(row['PRECIO_50_U'] ?? '0'));
    const precio100 = parseFloat(String(row['PRECIO_100_U'] ?? '0'));
    const precio200 = parseFloat(String(row['PRECIO_200_U'] ?? '0'));
    const disponibleStr = String(row['DISPONIBLE'] ?? 'No').toLowerCase();
    const disponible = disponibleStr === 'sí' || disponibleStr === 'si' ? 1 : 0;
    const categoria = escapeSQL(String(row['CATEGORÍA'] ?? row['CATEGORIA'] ?? ''));
    const description = escapeSQL(String(row['DESCRIPCIÓN'] ?? row['DESCRIPCION'] ?? ''));

    sql += `INSERT INTO products (id, name, tipo_prenda, talla, color, stock, precio_50, precio_100, precio_200, disponible, categoria, description) VALUES (${id}, '${name}', '${tipoPrenda}', '${talla}', '${color}', ${stock}, ${precio50}, ${precio100}, ${precio200}, ${disponible}, '${categoria}', '${description}');\n`;
  }

  const seedsDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(seedsDir)) {
    fs.mkdirSync(seedsDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, sql, 'utf-8');
  console.log(`Generated ${rows.length} product INSERT statements in ${OUTPUT_PATH}`);
}

main();
