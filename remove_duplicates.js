const fs = require('fs');

// Ler o arquivo CSV
const fileContent = fs.readFileSync('./merged.csv', 'utf-8');
const linhas = fileContent.split('\n');

console.log(`Total de linhas originais: ${linhas.length - 1}`);

// Separar header da primeira linha
const header = linhas[0];
const headerFields = header.split(',');
const codBarrasIndex = headerFields.findIndex(field => field.trim() === 'COD_BARRAS');

console.log(`Índice COD_BARRAS: ${codBarrasIndex}`);

// Remover duplicados baseado em COD_BARRAS mantendo primeira ocorrência
const seen = new Set();
const unique = [header];
let duplicadosRemovidos = 0;

for (let i = 1; i < linhas.length; i++) {
  if (linhas[i].trim() === '') continue;
  
  // Extract COD_BARRAS value (first field)
  const firstCommaIndex = linhas[i].indexOf(',');
  const barrasRaw = linhas[i].substring(0, firstCommaIndex).trim();
  const barras = barrasRaw.replace(/"/g, '');
  
  if (!seen.has(barras)) {
    seen.add(barras);
    unique.push(linhas[i]);
  } else {
    duplicadosRemovidos++;
  }
}

console.log(`Linhas únicas: ${unique.length - 1}`);
console.log(`Duplicados removidos: ${duplicadosRemovidos}`);

// Salvar arquivo atualizado
const output = unique.join('\n');
fs.writeFileSync('./merged.csv', output, 'utf-8');

console.log('✓ Arquivo merged.csv atualizado com sucesso!');

// Calcular tamanho
const tamanho = fs.statSync('./merged.csv').size;
console.log(`Novo tamanho do arquivo: ${(tamanho / 1024 / 1024).toFixed(2)} MB`);
