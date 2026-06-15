/* ═══════════════════════════════════════════════════════
   PharmaPOS — Application Logic
   ═══════════════════════════════════════════════════════ */

'use strict';

// ──────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────
const State = {
  products: [],       // {barcode, name, lab, price, promo}
  cart: [],           // {product, qty, total}
  sales: [],          // {id, datetime, items, total}
  saleCounter: 0,
  falteiros: [],      // {barcode, name, lab}

  // Carrega do localStorage
  load() {
    try {
      const p = localStorage.getItem('pharmapos_products');
      const s = localStorage.getItem('pharmapos_sales');
      const c = localStorage.getItem('pharmapos_counter');
      const f = localStorage.getItem('pharmapos_falteiros');
      if (p) this.products = JSON.parse(p);
      if (s) this.sales    = JSON.parse(s);
      if (c) this.saleCounter = parseInt(c) || 0;
      if (f) this.falteiros = JSON.parse(f);
    } catch(e) { console.warn('Load error', e); }
  },

  saveProducts() {
    try { localStorage.setItem('pharmapos_products', JSON.stringify(this.products)); } catch(e) {}
  },

  saveSales() {
    try {
      localStorage.setItem('pharmapos_sales', JSON.stringify(this.sales));
      localStorage.setItem('pharmapos_counter', this.saleCounter);
    } catch(e) {}
  },

  saveFalteiros() {
    try { localStorage.setItem('pharmapos_falteiros', JSON.stringify(this.falteiros)); } catch(e) {}
  }
};

// ──────────────────────────────────────────────
// DOM REFS
// ──────────────────────────────────────────────
const $ = id => document.getElementById(id);
const DOM = {
  clock: $('clock'), date: $('date'),
  // theme toggle
  btnThemeToggle: $('btnThemeToggle'),
  iconDark: $('iconDark'),
  iconLight: $('iconLight'),
  // tabs
  tabs:           document.querySelectorAll('.tab'),
  tabContents:    document.querySelectorAll('.tab-content'),
  // barcode
  barcodeInput:   $('barcodeInput'),
  btnScan:        $('btnScan'),
  // search
  searchInput:    $('searchInput'),
  searchResults:  $('searchResults'),
  // product
  productCard:     $('productCard'),
  productName:     $('productName'),
  productLab:      $('productLab'),
  productBarcode:  $('productBarcode'),
  productPrice:    $('productPriceInput'),
  productTotal:    $('productTotal'),
  qtyInput:        $('qtyInput'),
  btnQtyMinus:     $('btnQtyMinus'),
  btnQtyPlus:      $('btnQtyPlus'),
  btnAddToCart:    $('btnAddToCart'),
  btnClearProduct: $('btnClearProduct'),
  notFound:        $('notFound'),
  btnFalteiro:        $('btnFalteiro'),
  falteiroBadge:      $('falteiroBadge'),
  falteiroCount:      $('falteiroCount'),
  reportTabVendas:    $('reportTabVendas'),
  reportTabFalteiros: $('reportTabFalteiros'),
  reportVendasView:   $('reportVendasView'),
  reportFalteirosView:$('reportFalteirosView'),
  falteirosList:      $('falteirosList'),
  btnPrintFalteiros:  $('btnPrintFalteiros'),
  // cart
  cartList:     $('cartList'),
  cartCount:    $('cartCount'),
  cartFooter:   $('cartFooter'),
  cartSubtotal: $('cartSubtotal'),
  btnClearCart: $('btnClearCart'),
  btnFinalize:  $('btnFinalize'),
  // summary
  statTotal:  $('statTotal'),
  statSales:  $('statSales'),
  statItems:  $('statItems'),
  statAvg:    $('statAvg'),
  salesList:  $('salesList'),
  todayLabel: $('todayLabel'),
  importStatus:     $('importStatus'),
  importStatusText: $('importStatusText'),
  // modals
  btnImport:       $('btnImport'),
  modalImport:     $('modalImport'),
  btnCloseImport:  $('btnCloseImport'),
  dropZone:        $('dropZone'),
  fileInput:       $('fileInput'),
  importProgress:  $('importProgress'),
  progressFill:    $('progressFill'),
  progressText:    $('progressText'),
  btnReports:      $('btnReports'),
  modalReports:    $('modalReports'),
  btnCloseReports: $('btnCloseReports'),
  reportPeriod:    $('reportPeriod'),
  btnGenerateReport: $('btnGenerateReport'),
  btnExportReport:   $('btnExportReport'),
  reportStats:       $('reportStats'),
  reportBody:        $('reportBody'),
  modalSuccess:    $('modalSuccess'),
  successTotal:    $('successTotal'),
  successItems:    $('successItems'),
  btnSuccessOk:    $('btnSuccessOk'),
  toast: $('toast'),
  // Supabase
  btnSupabase:       $('btnSupabase'),
  modalSupabase:     $('modalSupabase'),
  btnCloseSupabase:  $('btnCloseSupabase'),
  inputSupabaseUrl:  $('inputSupabaseUrl'),
  inputSupabaseKey:  $('inputSupabaseKey'),
  btnTestSupabase:   $('btnTestSupabase'),
  btnSaveSupabase:   $('btnSaveSupabase'),
  supabaseTestResult:$('supabaseTestResult'),
  syncBadge:         $('syncBadge'),
  syncDot:           $('syncDot'),
  syncLabel:         $('syncLabel'),
};

// ──────────────────────────────────────────────
// THEME TOGGLE
// ──────────────────────────────────────────────
function setTheme(theme) {
  const html = document.documentElement;
  
  if (theme === 'light') {
    html.setAttribute('data-theme', 'light');
    DOM.iconDark.style.display = 'none';
    DOM.iconLight.style.display = 'block';
  } else {
    html.removeAttribute('data-theme');
    DOM.iconDark.style.display = 'block';
    DOM.iconLight.style.display = 'none';
  }
  
  localStorage.setItem('pharmapos_theme', theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

DOM.btnThemeToggle.addEventListener('click', toggleTheme);

// Load saved theme on init
const savedTheme = localStorage.getItem('pharmapos_theme') || 'dark';
setTheme(savedTheme);

// ──────────────────────────────────────────────
// UTILS
// ──────────────────────────────────────────────
function fmt(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parsePrice(raw) {
  if (!raw || raw === '' || raw === '0') return 0;
  // remove aspas, substitui vírgula por ponto
  let s = String(raw).replace(/"/g,'').trim();
  // formato especial "2.0,5" → "20.5" (centena separada por ponto, decimal por vírgula)
  // Detectar se há ponto E vírgula
  if (s.includes(',') && s.includes('.')) {
    // ponto é separador de milhar, vírgula é decimal
    s = s.replace(/\./g,'').replace(',','.');
  } else if (s.includes(',')) {
    s = s.replace(',','.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function todayStr() {
  return new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
}
function todayKey() {
  return new Date().toISOString().slice(0,10);
}

let toastTimer;
function showToast(msg, type = 'info', duration = 2500) {
  clearTimeout(toastTimer);
  DOM.toast.textContent = msg;
  DOM.toast.className = `toast ${type}`;
  toastTimer = setTimeout(() => { DOM.toast.className = 'toast hidden'; }, duration);
}

// ──────────────────────────────────────────────
// CLOCK
// ──────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  DOM.clock.textContent = now.toLocaleTimeString('pt-BR');
  DOM.date.textContent  = now.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short' });
  DOM.todayLabel.textContent = now.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// ──────────────────────────────────────────────
// TABS
// ──────────────────────────────────────────────
DOM.tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    DOM.tabs.forEach(t => t.classList.remove('active'));
    DOM.tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${target}`).classList.add('active');
    clearProduct();
    if (target === 'barcode') DOM.barcodeInput.focus();
    else DOM.searchInput.focus();
  });
});

// ──────────────────────────────────────────────
// PRODUCT STATE
// ──────────────────────────────────────────────
let currentProduct = null;

function clearProduct() {
  currentProduct = null;
  DOM.productCard.classList.add('hidden');
  DOM.notFound.classList.add('hidden');
  DOM.qtyInput.value = 1;
}

function isFalteiro(barcode) {
  return State.falteiros.some(f => f.barcode === barcode);
}

function updateFalteiroButton() {
  if (!currentProduct) return;
  const marked = isFalteiro(currentProduct.barcode);
  DOM.btnFalteiro.className = `btn btn-falteiro btn-full${marked ? ' active' : ''}`;
  DOM.btnFalteiro.querySelector('span').textContent = marked
    ? '✓ Remover dos Falteiros'
    : 'Marcar como Falteiro';
}

function toggleFalteiro() {
  if (!currentProduct) return;
  const idx = State.falteiros.findIndex(f => f.barcode === currentProduct.barcode);
  if (idx >= 0) {
    State.falteiros.splice(idx, 1);
    showToast('Removido dos falteiros', 'info');
  } else {
    State.falteiros.push({
      barcode: currentProduct.barcode,
      name: currentProduct.name,
      lab: currentProduct.lab || '',
    });
    showToast('Marcado como falteiro!', 'success');
  }
  State.saveFalteiros();
  updateFalteiroButton();
  updateFalteiroBadge();
}

DOM.btnFalteiro.addEventListener('click', toggleFalteiro);

function updateFalteiroBadge() {
  const count = State.falteiros.length;
  DOM.falteiroBadge.className = `import-status falteiro-status${count ? ' has-items' : ''}`;
  DOM.falteiroCount.textContent = count
    ? `${count} produto${count > 1 ? 's' : ''} falteiro${count > 1 ? 's' : ''}`
    : 'Nenhum produto falteiro';
}

function showProduct(product) {
  currentProduct = product;
  DOM.productName.textContent    = product.name;
  DOM.productLab.textContent     = product.lab  || '—';
  DOM.productBarcode.textContent = product.barcode || '—';
  
  // Define o valor inicial no input (formato original da tabela)
  DOM.productPrice.value = product.price.toFixed(2);
  
  updateProductPrice();
  updateFalteiroButton();
  DOM.productCard.classList.remove('hidden');
  DOM.notFound.classList.add('hidden');
}

function updateProductPrice() {
  if (!currentProduct) return;
  const qty   = parseInt(DOM.qtyInput.value) || 1;
  const price = parseFloat(DOM.productPrice.value) || 0;
  DOM.productTotal.textContent = fmt(price * qty);
}

// Atualiza o total ao alterar preço ou quantidade
DOM.productPrice.addEventListener('input', updateProductPrice);
DOM.qtyInput.addEventListener('input', updateProductPrice);
DOM.btnQtyMinus.addEventListener('click', () => {
  const v = parseInt(DOM.qtyInput.value) || 1;
  if (v > 1) { DOM.qtyInput.value = v - 1; updateProductPrice(); }
});
DOM.btnQtyPlus.addEventListener('click', () => {
  const v = parseInt(DOM.qtyInput.value) || 1;
  DOM.qtyInput.value = v + 1;
  updateProductPrice();
});
DOM.btnClearProduct.addEventListener('click', clearProduct);

// ──────────────────────────────────────────────
// BARCODE SEARCH
// ──────────────────────────────────────────────
function searchByBarcode(code) {
  code = String(code).trim();
  if (!code) return;
  clearProduct();
  const product = State.products.find(p => p.barcode === code);
  if (product) {
    showProduct(product);
    DOM.qtyInput.focus();
  } else {
    DOM.notFound.classList.remove('hidden');
    showToast('Produto não encontrado!', 'error');
  }
}

DOM.barcodeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    searchByBarcode(DOM.barcodeInput.value);
    DOM.barcodeInput.value = '';
  }
});
DOM.btnScan.addEventListener('click', () => {
  searchByBarcode(DOM.barcodeInput.value);
  DOM.barcodeInput.value = '';
  DOM.barcodeInput.focus();
});

// ──────────────────────────────────────────────
// NAME SEARCH (debounce 250ms)
// ──────────────────────────────────────────────
let searchTimer;
DOM.searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => doSearch(DOM.searchInput.value), 250);
});

function doSearch(query) {
  const q = query.trim().toLowerCase();
  DOM.searchResults.innerHTML = '';
  clearProduct();
  if (q.length < 2) return;

  const hits = State.products
    .filter(p => p.name.toLowerCase().includes(q) || (p.lab && p.lab.toLowerCase().includes(q)))
    .slice(0, 30);

  if (!hits.length) {
    DOM.searchResults.innerHTML = '<div class="search-empty">Nenhum produto encontrado.</div>';
    return;
  }

  hits.forEach(p => {
    const div = document.createElement('div');
    div.className = 'search-result-item';
    div.innerHTML = `
      <div class="result-info">
        <div class="result-name">${highlightMatch(p.name, q)}</div>
        <div class="result-lab">${p.lab || '—'} &nbsp;·&nbsp; ${p.barcode}</div>
      </div>
      <div class="result-price">${fmt(p.price)}</div>
    `;
    div.addEventListener('click', () => {
      clearProduct();
      showProduct(p);
      DOM.searchResults.innerHTML = '';
      DOM.searchInput.value = '';
    });
    DOM.searchResults.appendChild(div);
  });
}

function highlightMatch(text, q) {
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark style="background:rgba(99,102,241,.25);color:#a5b4fc;border-radius:2px">$1</mark>');
}

// ──────────────────────────────────────────────
// CART
// ──────────────────────────────────────────────
function addToCart() {
  if (!currentProduct) return;
  const qty = parseInt(DOM.qtyInput.value) || 1;
  if (qty <= 0) { showToast('Quantidade inválida', 'error'); return; }

  // Captura o preço atual do campo (pode ter sido alterado)
  const priceToUse = parseFloat(DOM.productPrice.value) || 0;
  if (priceToUse <= 0) { showToast('Preço inválido!', 'error'); return; }

  // Verifica se produto já está no carrinho
  const existing = State.cart.find(i => i.product.barcode === currentProduct.barcode);
  if (existing) {
    existing.qty   += qty;
    // O preço no carrinho pode ser o novo ou manter o atual? 
    // Vamos atualizar para o novo preço caso tenha mudado no cartão
    existing.product.price = priceToUse; 
    existing.total  = existing.product.price * existing.qty;
    showToast(`Quantidade atualizada: ${existing.qty}x`, 'info');
  } else {
    State.cart.push({
      product: { ...currentProduct, price: priceToUse },
      qty,
      total: priceToUse * qty
    });
    showToast(`${currentProduct.name.slice(0,30)} adicionado!`, 'success');
  }

  clearProduct();
  DOM.barcodeInput.value = '';
  DOM.barcodeInput.focus();
  renderCart();
}

DOM.btnAddToCart.addEventListener('click', addToCart);
// Enter no campo de quantidade também adiciona
DOM.qtyInput.addEventListener('keydown', e => { if (e.key === 'Enter') addToCart(); });

function renderCart() {
  const list = DOM.cartList;

  if (!State.cart.length) {
    list.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 48 48" fill="none"><path d="M4 6h5l5.5 20h19L40 14H14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="21" cy="41" r="3" fill="currentColor" opacity=".3"/><circle cx="35" cy="41" r="3" fill="currentColor" opacity=".3"/></svg>
        <p>Nenhum item adicionado</p>
      </div>`;
    DOM.cartFooter.style.display = 'none';
    DOM.cartCount.textContent = '0 itens';
    return;
  }

  const total = State.cart.reduce((s, i) => s + i.total, 0);
  const qty   = State.cart.reduce((s, i) => s + i.qty, 0);

  list.innerHTML = State.cart.map((item, idx) => `
    <div class="cart-item" data-idx="${idx}">
      <div class="cart-item-num">${idx+1}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.product.name}</div>
        <div class="cart-item-meta">${item.product.lab || '—'} · <input type="number" step="0.01" class="cart-edit-price" data-idx="${idx}" value="${item.product.price.toFixed(2)}" /> / un.</div>
      </div>
      <div class="cart-item-right">
        <div class="cart-item-qty">${item.qty}x</div>
        <div class="cart-item-total">${fmt(item.total)}</div>
        <div style="display:flex;gap:4px;justify-content:flex-end;margin-top:4px">
          <button class="cart-item-falteiro" data-idx="${idx}" data-barcode="${item.product.barcode}" title="${isFalteiro(item.product.barcode) ? 'Remover dos Falteiros' : 'Marcar como Falteiro (última caixa)'}" style="background:none;border:1px solid ${isFalteiro(item.product.barcode) ? 'rgba(34,197,94,.3)' : 'var(--border)'};border-radius:4px;cursor:pointer;padding:2px 6px;font-size:.65rem;font-weight:600;color:${isFalteiro(item.product.barcode) ? 'var(--green)' : 'var(--text-3)'};transition:var(--transition)">${isFalteiro(item.product.barcode) ? 'OK' : 'Falt'}</button>
          <button class="cart-item-remove" data-idx="${idx}" title="Remover">
            <svg viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Eventos do Carrinho
  list.querySelectorAll('.cart-edit-price').forEach(input => {
    input.addEventListener('change', e => {
      const idx = parseInt(e.target.dataset.idx);
      const newPrice = parseFloat(e.target.value);
      if (!isNaN(newPrice) && newPrice >= 0) {
        updateCartItemPrice(idx, newPrice);
      } else {
        renderCart(); // Reseta para o valor anterior
      }
    });
    // Evita que o clique no input selecione o item (se houvesse essa lógica)
    input.addEventListener('click', e => e.stopPropagation());
  });

  list.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      State.cart.splice(parseInt(btn.dataset.idx), 1);
      renderCart();
    });
  });

  list.querySelectorAll('.cart-item-falteiro').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      const item = State.cart[idx];
      if (!item) return;
      const existingIdx = State.falteiros.findIndex(f => f.barcode === item.product.barcode);
      if (existingIdx >= 0) {
        State.falteiros.splice(existingIdx, 1);
        showToast('Removido dos falteiros', 'info');
      } else {
        State.falteiros.push({
          barcode: item.product.barcode,
          name: item.product.name,
          lab: item.product.lab || '',
        });
        showToast(`${item.product.name.slice(0, 30)} marcado como falteiro!`, 'success');
      }
      State.saveFalteiros();
      updateFalteiroBadge();
      if (currentProduct) updateFalteiroButton();
      renderCart();
    });
  });

  DOM.cartSubtotal.textContent = fmt(total);
  DOM.cartCount.textContent = `${State.cart.length} produto${State.cart.length>1?'s':''} · ${qty} item${qty>1?'s':''}`;
  DOM.cartFooter.style.display = 'block';
}

function updateCartItemPrice(idx, newPrice) {
  const item = State.cart[idx];
  if (!item) return;
  
  item.product.price = newPrice;
  item.total = item.qty * newPrice;
  
  renderCart();
  showToast('Preço ajustado manualmente', 'info');
}

DOM.btnClearCart.addEventListener('click', () => {
  if (!State.cart.length) return;
  if (!confirm('Cancelar toda a venda?')) return;
  State.cart = [];
  renderCart();
  clearProduct();
  showToast('Venda cancelada', 'info');
});

// ──────────────────────────────────────────────
// FINALIZE SALE
// ──────────────────────────────────────────────
DOM.btnFinalize.addEventListener('click', finalizeSale);

async function finalizeSale() {
  if (!State.cart.length) return;

  const total = State.cart.reduce((s, i) => s + i.total, 0);
  const qty   = State.cart.reduce((s, i) => s + i.qty, 0);

  State.saleCounter++;
  const sale = {
    id: State.saleCounter,
    datetime: new Date().toISOString(),
    datekey: todayKey(),
    items: State.cart.map(i => ({
      barcode: i.product.barcode,
      name:    i.product.name,
      lab:     i.product.lab,
      price:   i.product.price,
      qty:     i.qty,
      total:   i.total,
    })),
    total,
    qty,
  };

  // 1. Salva no localStorage (imediato)
  State.sales.unshift(sale);
  State.saveSales();

  // 2. Sincroniza com Supabase (assíncrono — não bloqueia o caixa)
  if (window.PharmaPOS?.SaleRepository) {
    setSyncStatus('syncing', 'Sincronizando...');
    window.PharmaPOS.SaleRepository.save(sale)
      .then(() => setSyncStatus('connected', 'Sincronizado'))
      .catch(() => setSyncStatus('error', 'Falha na sync'));
  }

  // 3. Reset carrinho
  State.cart = [];
  renderCart();
  clearProduct();

  // 4. Modal de sucesso
  DOM.successTotal.textContent = fmt(total);
  DOM.successItems.textContent = `${qty} item${qty>1?'s':''}`;
  DOM.modalSuccess.classList.remove('hidden');

  updateSummary();
}

DOM.btnSuccessOk.addEventListener('click', () => {
  DOM.modalSuccess.classList.add('hidden');
  DOM.barcodeInput.focus();
});

// ──────────────────────────────────────────────
// SYNC BADGE
// ──────────────────────────────────────────────
function setSyncStatus(state, label) {
  DOM.syncBadge.className = `sync-badge ${state}`;
  DOM.syncLabel.textContent = label;
}

// Ouve eventos do SyncStatus (online/offline do navegador)
if (window.PharmaPOS?.SyncStatus) {
  window.PharmaPOS.SyncStatus.onChange(status => {
    if (status === 'online')   setSyncStatus('connected', 'Conectado');
    if (status === 'offline')  setSyncStatus('error',     'Sem conexão');
    if (status === 'syncing')  setSyncStatus('syncing',   'Sincronizando...');
    if (status === 'error')    setSyncStatus('error',     'Erro na sync');
  });
}

// ──────────────────────────────────────────────
// MODAL SUPABASE
// ──────────────────────────────────────────────
DOM.btnSupabase.addEventListener('click', () => {
  // Preenche com valores salvos
  const url = localStorage.getItem('supabase_url') || '';
  const key = localStorage.getItem('supabase_key') || '';
  DOM.inputSupabaseUrl.value = url;
  DOM.inputSupabaseKey.value = key;
  DOM.supabaseTestResult.className = 'test-result hidden';
  DOM.modalSupabase.classList.remove('hidden');
});
DOM.btnCloseSupabase.addEventListener('click', () => DOM.modalSupabase.classList.add('hidden'));
DOM.modalSupabase.addEventListener('click', e => { if (e.target === DOM.modalSupabase) DOM.modalSupabase.classList.add('hidden'); });

DOM.btnTestSupabase.addEventListener('click', async () => {
  const url = DOM.inputSupabaseUrl.value.trim();
  const key = DOM.inputSupabaseKey.value.trim();
  if (!url || !key) { showToast('Preencha URL e Key!', 'error'); return; }

  // Salva temporariamente para testar
  window.PharmaPOS.ConfigRepository.save(url, key);

  DOM.btnTestSupabase.disabled = true;
  DOM.btnTestSupabase.textContent = 'Testando...';
  DOM.supabaseTestResult.className = 'test-result hidden';

  try {
    await window.PharmaPOS.ConfigRepository.testConnection();
    DOM.supabaseTestResult.textContent = '✓ Conexão bem-sucedida! Tabelas encontradas.';
    DOM.supabaseTestResult.className = 'test-result ok';
    setSyncStatus('connected', 'Conectado');
  } catch (err) {
    DOM.supabaseTestResult.textContent = `✗ ${err.message}`;
    DOM.supabaseTestResult.className = 'test-result fail';
    setSyncStatus('error', 'Erro na conexão');
  } finally {
    DOM.btnTestSupabase.disabled = false;
    DOM.btnTestSupabase.textContent = 'Testar Conexão';
  }
});

DOM.btnSaveSupabase.addEventListener('click', async () => {
  const url = DOM.inputSupabaseUrl.value.trim();
  const key = DOM.inputSupabaseKey.value.trim();
  if (!url || !key) { showToast('Preencha URL e Key!', 'error'); return; }

  window.PharmaPOS.ConfigRepository.save(url, key);
  showToast('Credenciais salvas! Testando conexão...', 'info');
  DOM.modalSupabase.classList.add('hidden');

  // Testa a conexão e sincroniza fila offline
  setSyncStatus('syncing', 'Conectando...');
  try {
    await window.PharmaPOS.ConfigRepository.testConnection();
    setSyncStatus('connected', 'Conectado');
    showToast('Supabase conectado com sucesso!', 'success', 4000);

    // Tenta sincronizar possíveis vendas offline
    const synced = await window.PharmaPOS.OfflineQueue.flush();
    if (synced > 0) showToast(`${synced} venda(s) sincronizada(s)!`, 'success', 3000);

    // Recarrega o resumo do dia buscando do Supabase
    updateSummary();
  } catch (err) {
    setSyncStatus('error', 'Falha na conexão');
    showToast('Falha ao conectar. Verifique as credenciais.', 'error', 4000);
  }
});

// ──────────────────────────────────────────────
// SUMMARY — atualizado para usar Supabase
// ──────────────────────────────────────────────
async function updateSummary() {
  let todaySales;

  // Tenta carregar do Supabase, senão usa localStorage
  if (window.PharmaPOS?.SaleRepository) {
    try {
      todaySales = await window.PharmaPOS.SaleRepository.findToday();
    } catch {
      todaySales = State.sales.filter(s => s.datekey === todayKey());
    }
  } else {
    todaySales = State.sales.filter(s => s.datekey === todayKey());
  }

  const total = todaySales.reduce((s, v) => s + v.total, 0);
  const items = todaySales.reduce((s, v) => s + v.qty, 0);
  const avg   = todaySales.length ? total / todaySales.length : 0;

  DOM.statTotal.textContent = fmt(total);
  DOM.statSales.textContent = todaySales.length;
  DOM.statItems.textContent = items;
  DOM.statAvg.textContent   = fmt(avg);

  renderSalesList(todaySales.slice(0, 15));
}

function renderSalesList(sales) {
  if (!sales.length) {
    DOM.salesList.innerHTML = `
      <div class="sales-empty">
        <svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" opacity=".3"/><path d="M24 14v10l7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <p>Nenhuma venda hoje</p>
      </div>`;
    return;
  }

  DOM.salesList.innerHTML = sales.map(s => {
    const t = new Date(s.datetime);
    const time = t.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    const itemsList = (s.items || []).map(item => `
      <div class="sale-product-line">
        <span class="product-qty">${item.qty}x</span>
        <span class="product-name" title="${item.name}">${item.name}</span>
        <span class="product-total">${fmt(item.total)}</span>
      </div>
    `).join('');

    return `
      <div class="sale-item">
        <div class="sale-header">
          <span class="sale-num">Venda #${s.id}</span>
          <div style="display:flex;align-items:center;gap:0.375rem">
            <span class="sale-time">${time}</span>
            <button class="btn-delete-sale" data-id="${s.id}" title="Excluir Venda">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><path d="M3 6h14m-2 0v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="sale-products">
          ${itemsList}
        </div>
        <div class="sale-footer">
          <span class="sale-count">${s.qty} item${s.qty>1?'s':''} · ${(s.items || []).length} prod</span>
          <span class="sale-total-val">${fmt(s.total)}</span>
        </div>
      </div>`;
  }).join('');

  // Vincular eventos de exclusão
  DOM.salesList.querySelectorAll('.btn-delete-sale').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      deleteSale(id);
    });
  });
}

async function deleteSale(id) {
  if (!confirm(`Deseja realmente excluir a Venda #${id}? Esta ação não pode ser desfeita.`)) return;

  try {
    // 1. Remove do estado local em memória
    State.sales = State.sales.filter(s => String(s.id) !== String(id));
    State.saveSales();

    // 2. Remove do Supabase / Fila Offline
    if (window.PharmaPOS?.SaleRepository) {
      setSyncStatus('syncing', 'Excluindo...');
      await window.PharmaPOS.SaleRepository.delete(id)
        .then(() => setSyncStatus('connected', 'Sincronizado'))
        .catch(() => setSyncStatus('error', 'Falha na sync'));
    }

    showToast(`Venda #${id} excluída com sucesso!`, 'success');

    // 3. Atualiza o resumo do dia
    updateSummary();
  } catch (err) {
    showToast('Erro ao excluir venda!', 'error');
    console.error(err);
  }
}

// ──────────────────────────────────────────────
// IMPORT CSV
// ──────────────────────────────────────────────
DOM.btnImport.addEventListener('click', () => DOM.modalImport.classList.remove('hidden'));
DOM.btnCloseImport.addEventListener('click', () => DOM.modalImport.classList.add('hidden'));
DOM.modalImport.addEventListener('click', e => { if (e.target === DOM.modalImport) DOM.modalImport.classList.add('hidden'); });

DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());
DOM.dropZone.addEventListener('dragover', e => { e.preventDefault(); DOM.dropZone.classList.add('dragover'); });
DOM.dropZone.addEventListener('dragleave', () => DOM.dropZone.classList.remove('dragover'));
DOM.dropZone.addEventListener('drop', e => {
  e.preventDefault();
  DOM.dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) processCSV(file);
});
DOM.fileInput.addEventListener('change', () => {
  const file = DOM.fileInput.files[0];
  if (file) processCSV(file);
});

function processCSV(file) {
  DOM.importProgress.classList.remove('hidden');
  DOM.progressFill.style.width = '0%';
  DOM.progressText.textContent = 'Lendo arquivo...';

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const text = e.target.result;
      const result = processCSVData(text);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const products = result.products;
      DOM.progressFill.style.width = '90%';
      DOM.progressText.textContent = `Salvando ${products.length.toLocaleString()} produtos...`;

      setTimeout(() => {
        State.products = products;
        State.saveProducts();

        DOM.progressFill.style.width = '100%';
        DOM.progressText.textContent = `✓ ${products.length.toLocaleString()} produtos importados!`;

        updateImportStatus();
        showToast(`${products.length.toLocaleString()} produtos importados com sucesso!`, 'success', 4000);

        setTimeout(() => {
          DOM.modalImport.classList.add('hidden');
          DOM.importProgress.classList.add('hidden');
          DOM.progressFill.style.width = '0%';
        }, 1500);
      }, 200);

    } catch(err) {
      console.error(err);
      DOM.progressText.textContent = `Erro: ${err.message}`;
      showToast('Erro ao processar CSV!', 'error');
    }
  };

  reader.onerror = () => showToast('Erro ao ler arquivo!', 'error');
  reader.readAsText(file, 'windows-1252');
}

/**
 * Processa o texto bruto do CSV e retorna a lista de produtos
 */
function processCSVData(text) {
  try {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return { error: 'Arquivo vazio ou inválido' };

    // Detectar delimitador (; ou ,)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    
    const header = parseCSVLine(firstLine, delimiter);
    const colIdx = buildColIndex(header);

    const products = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = parseCSVLine(line, delimiter);
      if (cols.length < 3) continue;

      const barcode = cols[colIdx.cod_barras] ? String(cols[colIdx.cod_barras]).trim() : '';
      const name    = cols[colIdx.nomeorder]  ? cols[colIdx.nomeorder].trim()           : '';
      const lab     = cols[colIdx.fornecedor]  ? cols[colIdx.fornecedor].trim()          : '';

      // Preço: preferir PROMOCAO se for diferente de 0, senão usar VENDA
      let price = 0;
      const rawVenda  = colIdx.venda  != null ? cols[colIdx.venda]  : null;
      const rawPromo  = colIdx.promocao != null ? cols[colIdx.promocao] : null;
      const rawValor  = colIdx.valor  != null ? cols[colIdx.valor]  : null;

      const venda  = parsePrice(rawVenda);
      const promo  = parsePrice(rawPromo);
      const valor  = parsePrice(rawValor);

      if (promo > 0) price = promo;
      else if (venda > 0) price = venda;
      else price = valor;

      if (!barcode || !name || price <= 0) continue;

      products.push({ barcode, name, lab, price });
    }

    return { products };
  } catch (err) {
    return { error: err.message };
  }
}

function buildColIndex(header) {
  const idx = {};
  header.forEach((col, i) => {
    const key = col.trim().toLowerCase().replace(/[^a-z_]/g,'_');
    idx[key] = i;
  });
  // normalize common variants
  return {
    cod_barras: idx['cod_barras'] ?? idx['codbarras'] ?? idx['codigo_barras'] ?? 0,
    nomeorder:  idx['nomeorder']  ?? idx['nome']       ?? idx['produto']       ?? 2,
    fornecedor: idx['fornecedor'] ?? idx['lab']         ?? idx['laboratorio']   ?? 3,
    venda:      idx['venda']      ?? idx['preco_venda'] ?? 14,
    promocao:   idx['promocao']   ?? idx['promo']       ?? 15,
    valor:      idx['valor']      ?? idx['price']       ?? 21,
  };
}

function parseCSVLine(line, delimiter = ',') {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === delimiter && !inQuote) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

// ──────────────────────────────────────────────
// GLOBAL DROP (DROP ANYWHERE)
// ──────────────────────────────────────────────
window.addEventListener('dragover', e => {
  e.preventDefault();
  // Feedback visual opcional se quiser
});

window.addEventListener('drop', e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.name.toLowerCase().endsWith('.csv')) {
    showToast(`Arquivo detectado: ${file.name}. Importando...`, 'info');
    processCSV(file);
  }
});

function updateImportStatus() {
  if (State.products.length) {
    DOM.importStatus.className = 'import-status ok';
    DOM.importStatusText.textContent = `${State.products.length.toLocaleString()} produtos na base · Última importação: ${new Date().toLocaleString('pt-BR')}`;
  } else {
    DOM.importStatus.className = 'import-status';
    DOM.importStatusText.textContent = 'Nenhuma tabela importada';
  }
}

// ──────────────────────────────────────────────
// REPORTS
// ──────────────────────────────────────────────
DOM.btnReports.addEventListener('click', () => {
  DOM.modalReports.classList.remove('hidden');
  generateReport();
  renderFalteirosList();
});

// Toggle between Vendas / Falteiros tabs
DOM.reportTabVendas.addEventListener('click', () => {
  DOM.reportTabVendas.classList.add('active');
  DOM.reportTabFalteiros.classList.remove('active');
  DOM.reportVendasView.classList.remove('hidden');
  DOM.reportFalteirosView.classList.add('hidden');
});
DOM.reportTabFalteiros.addEventListener('click', () => {
  DOM.reportTabFalteiros.classList.add('active');
  DOM.reportTabVendas.classList.remove('active');
  DOM.reportFalteirosView.classList.remove('hidden');
  DOM.reportVendasView.classList.add('hidden');
  renderFalteirosList();
});

function renderFalteirosList() {
  const list = DOM.falteirosList;
  if (!State.falteiros.length) {
    list.innerHTML = `
      <div class="sales-empty">
        <svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" opacity=".3"/><path d="M24 14v10l7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <p>Nenhum produto marcado como falteiro</p>
      </div>`;
    return;
  }
  list.innerHTML = State.falteiros.map((f, idx) => `
    <div class="falteiro-item">
      <div class="falteiro-item-info">
        <div class="falteiro-item-name">${f.name}</div>
        <div class="falteiro-item-lab">${f.lab || '—'}</div>
      </div>
      <button class="falteiro-item-remove" data-idx="${idx}" title="Remover">
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
  `).join('');

  list.querySelectorAll('.falteiro-item-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      State.falteiros.splice(idx, 1);
      State.saveFalteiros();
      renderFalteirosList();
      updateFalteiroBadge();
      showToast('Removido dos falteiros', 'info');
      // Se estiver no produto atual, atualiza o botão
      if (currentProduct) updateFalteiroButton();
    });
  });
}

// Print falteiros list
DOM.btnPrintFalteiros.addEventListener('click', () => {
  window.print();
});
DOM.btnCloseReports.addEventListener('click', () => DOM.modalReports.classList.add('hidden'));
DOM.modalReports.addEventListener('click', e => { if (e.target === DOM.modalReports) DOM.modalReports.classList.add('hidden'); });
DOM.btnGenerateReport.addEventListener('click', generateReport);

function generateReport() {
  const period = DOM.reportPeriod.value;
  const key    = todayKey();
  const now    = new Date();

  let filtered = State.sales;

  if (period === 'today') {
    filtered = State.sales.filter(s => s.datekey === key);
  } else if (period === 'week') {
    const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 7);
    filtered = State.sales.filter(s => new Date(s.datetime) >= cutoff);
  } else if (period === 'month') {
    const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30);
    filtered = State.sales.filter(s => new Date(s.datetime) >= cutoff);
  }

  const total = filtered.reduce((s, v) => s + v.total, 0);
  const items = filtered.reduce((s, v) => s + v.qty, 0);
  const avg   = filtered.length ? total / filtered.length : 0;

  DOM.reportStats.innerHTML = `
    <div class="report-stat">
      <div class="report-stat-val">${filtered.length}</div>
      <div class="report-stat-label">Vendas</div>
    </div>
    <div class="report-stat">
      <div class="report-stat-val">${fmt(total)}</div>
      <div class="report-stat-label">Total</div>
    </div>
    <div class="report-stat">
      <div class="report-stat-val">${fmt(avg)}</div>
      <div class="report-stat-label">Ticket Médio</div>
    </div>
  `;

  DOM.reportBody.innerHTML = filtered.map(s => {
    const dt = new Date(s.datetime);
    const dtStr = dt.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const names = s.items.slice(0,3).map(i => i.name.slice(0,20)).join(', ') + (s.items.length > 3 ? '...' : '');
    return `
      <tr>
        <td>#${s.id}</td>
        <td>${dtStr}</td>
        <td>${s.qty}</td>
        <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${s.items.map(i=>i.name).join(', ')}">${names}</td>
        <td class="report-total-cell">${fmt(s.total)}</td>
      </tr>`;
  }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:2rem">Nenhuma venda no período</td></tr>';
}

// Export CSV
DOM.btnExportReport.addEventListener('click', () => {
  const period = DOM.reportPeriod.value;
  const key = todayKey();
  const now = new Date();
  let filtered = State.sales;
  if (period === 'today') filtered = State.sales.filter(s => s.datekey === key);
  else if (period === 'week') {
    const c = new Date(now); c.setDate(c.getDate()-7);
    filtered = State.sales.filter(s => new Date(s.datetime) >= c);
  } else if (period === 'month') {
    const c = new Date(now); c.setDate(c.getDate()-30);
    filtered = State.sales.filter(s => new Date(s.datetime) >= c);
  }

  let csv = 'Venda;Data;Hora;Produto;Laboratório;Código Barras;Quantidade;Preço Unit.;Total Item;Total Venda\n';
  for (const s of filtered) {
    const dt = new Date(s.datetime);
    const d = dt.toLocaleDateString('pt-BR');
    const h = dt.toLocaleTimeString('pt-BR');
    for (const item of s.items) {
      csv += `"${s.id}";"${d}";"${h}";"${item.name}";"${item.lab||''}";"${item.barcode||''}";"${item.qty}";"${item.price.toFixed(2).replace('.',',')}";"${item.total.toFixed(2).replace('.',',')}";"${s.total.toFixed(2).replace('.',',')}"\n`;
    }
  }

  const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `vendas_farmacia_do_bairro_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Relatório exportado!', 'success');
});

// ──────────────────────────────────────────────
// KEYBOARD SHORTCUTS
// ──────────────────────────────────────────────
document.addEventListener('keydown', e => {
  // Esc fecha modais
  if (e.key === 'Escape') {
    DOM.modalImport.classList.add('hidden');
    DOM.modalReports.classList.add('hidden');
    DOM.modalSuccess.classList.add('hidden');
  }
  // F2 = foco no barcode
  if (e.key === 'F2') {
    e.preventDefault();
    DOM.tabs[0].click();
    DOM.barcodeInput.focus();
  }
  // F4 = abrir relatórios
  if (e.key === 'F4') { e.preventDefault(); DOM.btnReports.click(); }
  // F5 = importar
  if (e.key === 'F5') { e.preventDefault(); DOM.btnImport.click(); }
});

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
function init() {
  State.load();
  updateSummary();
  updateImportStatus();
  updateFalteiroBadge();
  renderCart();
  DOM.barcodeInput.focus();

  // Se já há produtos, mostrar toast de boas-vindas
  if (State.products.length) {
    setTimeout(() => {
      showToast(`Base com ${State.products.length.toLocaleString()} produtos carregada`, 'success', 3000);
    }, 800);
  }
}

init();
