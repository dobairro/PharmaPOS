const fs = require('fs');
const path = require('path');

// Simple CSV parser that handles quotes
function parseCSV(content, separator) {
    const lines = content.split('\n').filter(line => line.trim());
    const header = parseLine(lines[0], separator);
    const rows = lines.slice(1).map(line => parseLine(line, separator));
    return { header, rows };
}

function parseLine(line, separator) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Read first CSV
const file1 = path.join(__dirname, 'Estoque FisicoT.csv');
const content1 = fs.readFileSync(file1, 'utf8');
const csv1 = parseCSV(content1, ';');

// Read second CSV
const file2 = path.join(__dirname, 'Fisico.csv');
const content2 = fs.readFileSync(file2, 'utf8');
const csv2 = parseCSV(content2, ',');

// Standardize headers
// Add LOCALIZACAO to second header after FORNECEDOR (index 3)
csv2.header.splice(4, 0, 'LOCALIZACAO');

// Add VALOR to first header at end
csv1.header.push('VALOR');

// For rows, add empty LOCALIZACAO to second rows
csv2.rows.forEach(row => row.splice(4, 0, ''));

// Add empty VALOR to first rows
csv1.rows.forEach(row => row.push(''));

// Combine headers and rows
const combinedHeader = csv1.header;
const combinedRows = csv1.rows.concat(csv2.rows);

// Write to new CSV, using , as separator, and quote fields if necessary
function toCSVLine(arr) {
    return arr.map(field => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return '"' + field.replace(/"/g, '""') + '"';
        }
        return field;
    }).join(',');
}

const output = [toCSVLine(combinedHeader)].concat(combinedRows.map(toCSVLine)).join('\n');
fs.writeFileSync('merged.csv', output, 'utf8');

console.log('Merged CSV created as merged.csv');