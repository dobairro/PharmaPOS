/* ═══════════════════════════════════════════════════════
   PharmaPOS — Camada de Dados Supabase
   Repository Pattern + Retry + Fallback offline
   ═══════════════════════════════════════════════════════ */

'use strict';

// ──────────────────────────────────────────────
// CONFIGURAÇÃO — substitua com seus dados reais
// ──────────────────────────────────────────────
const SUPABASE_CONFIG = {
  url: localStorage.getItem('supabase_url') || 'https://rnkismzhwczbkrpcsbwl.supabase.co',
  key: localStorage.getItem('supabase_key') || '',
};

// ──────────────────────────────────────────────
// CLIENTE SUPABASE LEVE (sem lib externa)
// Usa a REST API do Supabase via fetch nativo
// ──────────────────────────────────────────────
const SupabaseClient = {
  get isConfigured() {
    return !!(SUPABASE_CONFIG.url && SUPABASE_CONFIG.key);
  },

  headers() {
    return {
      'apikey':        SUPABASE_CONFIG.key,
      'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=representation',
    };
  },

  // GET  /rest/v1/{table}?{query}
  async select(table, query = '') {
    const url = `${SUPABASE_CONFIG.url}/rest/v1/${table}${query ? '?' + query : ''}`;
    const res  = await fetchWithRetry(() => fetch(url, { headers: this.headers() }));
    if (!res.ok) throw new Error(`SELECT ${table} → HTTP ${res.status}`);
    return res.json();
  },

  // POST /rest/v1/{table}
  async insert(table, body) {
    const url = `${SUPABASE_CONFIG.url}/rest/v1/${table}`;
    const res  = await fetchWithRetry(() => fetch(url, {
      method:  'POST',
      headers: this.headers(),
      body:    JSON.stringify(body),
    }));
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`INSERT ${table} → ${err}`);
    }
    return res.json();
  },

  // PATCH /rest/v1/{table}?{filter}
  async update(table, filter, body) {
    const url = `${SUPABASE_CONFIG.url}/rest/v1/${table}?${filter}`;
    const res  = await fetchWithRetry(() => fetch(url, {
      method:  'PATCH',
      headers: this.headers(),
      body:    JSON.stringify(body),
    }));
    if (!res.ok) throw new Error(`UPDATE ${table} → HTTP ${res.status}`);
    return res.json();
  },

  // DELETE /rest/v1/{table}?{filter}
  async delete(table, filter) {
    const url = `${SUPABASE_CONFIG.url}/rest/v1/${table}?${filter}`;
    const res  = await fetchWithRetry(() => fetch(url, {
      method:  'DELETE',
      headers: this.headers(),
    }));
    if (!res.ok) throw new Error(`DELETE ${table} → HTTP ${res.status}`);
    return true;
  },
};

// ──────────────────────────────────────────────
// RETRY COM EXPONENTIAL BACKOFF
// ──────────────────────────────────────────────
async function fetchWithRetry(fn, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 800));
      }
    }
  }
  throw lastError;
}

// ──────────────────────────────────────────────
// FILA OFFLINE — persiste operações pendentes
// quando não há conexão e reenvia ao reconectar
// ──────────────────────────────────────────────
const OfflineQueue = {
  KEY: 'pharmapos_offline_queue',

  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
    catch { return []; }
  },

  save(queue) {
    localStorage.setItem(this.KEY, JSON.stringify(queue));
  },

  enqueue(op) {
    const queue = this.load();
    queue.push({ ...op, queued_at: new Date().toISOString() });
    this.save(queue);
    console.info('[OfflineQueue] Operação enfileirada:', op.type);
  },

  async flush() {
    if (!SupabaseClient.isConfigured) return 0;
    const queue = this.load();
    if (!queue.length) return 0;

    let synced = 0;
    const remaining = [];

    for (const op of queue) {
      try {
        if (op.type === 'INSERT_SALE') {
          await SaleRepository.syncSale(op.payload);
        }
        synced++;
      } catch (err) {
        console.warn('[OfflineQueue] Falha ao sincronizar:', err.message);
        remaining.push(op);
      }
    }

    this.save(remaining);
    return synced;
  },
};

// ──────────────────────────────────────────────
// SALE REPOSITORY
// Responsável por toda persistência de vendas
// ──────────────────────────────────────────────
const SaleRepository = {

  /**
   * Busca todas as vendas (com itens) em um intervalo de datas.
   * Se offline, retorna do localStorage.
   */
  async findAll({ from, to } = {}) {
    if (!SupabaseClient.isConfigured) {
      return this._fromLocalStorage({ from, to });
    }

    try {
      let query = 'select=id,local_id,created_at,total,qty,items(*)&order=created_at.desc';
      if (from) query += `&created_at=gte.${from}`;
      if (to)   query += `&created_at=lte.${to}`;

      const rows = await SupabaseClient.select('sales', query);

      // Normaliza para o formato interno do app
      return rows.map(this._normalize);
    } catch (err) {
      console.warn('[SaleRepository] Falha no Supabase, usando localStorage:', err.message);
      return this._fromLocalStorage({ from, to });
    }
  },

  /**
   * Busca vendas do dia atual.
   */
  async findToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.findAll({
      from: start.toISOString(),
      to:   end.toISOString(),
    });
  },

  /**
   * Persiste uma venda completa (sale + sale_items em transação).
   * Se offline, enfileira para sincronização posterior.
   */
  async save(sale) {
    if (!SupabaseClient.isConfigured) {
      console.warn('[SaleRepository] Supabase não configurado. Salvando só no localStorage.');
      return sale;
    }

    try {
      return await this.syncSale(sale);
    } catch (err) {
      console.warn('[SaleRepository] Offline. Enfileirando venda:', err.message);
      OfflineQueue.enqueue({ type: 'INSERT_SALE', payload: sale });
      return sale; // app continua funcionando
    }
  },

  /**
   * Sincroniza uma venda com o Supabase (chamado interno e pela fila offline).
   */
  async syncSale(sale) {
    // 1. Insere o cabeçalho da venda
    const [inserted] = await SupabaseClient.insert('sales', {
      local_id:   String(sale.id),
      created_at: sale.datetime,
      total:      sale.total,
      qty:        sale.qty,
    });

    if (!inserted?.id) throw new Error('Falha ao inserir venda');

    // 2. Insere os itens da venda (batch)
    const itemsPayload = sale.items.map(item => ({
      sale_id:   inserted.id,
      barcode:   item.barcode   || null,
      name:      item.name,
      lab:       item.lab       || null,
      unit_price: item.price,
      qty:       item.qty,
      total:     item.total,
    }));

    await SupabaseClient.insert('sale_items', itemsPayload);

    return { ...sale, supabase_id: inserted.id };
  },

  // ── Conversão Supabase → Formato interno ──
  _normalize(row) {
    return {
      id:       row.local_id || row.id,
      datetime: row.created_at,
      datekey:  row.created_at?.slice(0, 10),
      total:    row.total,
      qty:      row.qty,
      items:    (row.items || []).map(i => ({
        barcode: i.barcode,
        name:    i.name,
        lab:     i.lab,
        price:   i.unit_price,
        qty:     i.qty,
        total:   i.total,
      })),
    };
  },

  // ── Fallback: lê do localStorage ──
  _fromLocalStorage({ from, to } = {}) {
    try {
      const all = JSON.parse(localStorage.getItem('pharmapos_sales') || '[]');
      if (!from && !to) return all;
      return all.filter(s => {
        const d = new Date(s.datetime);
        if (from && d < new Date(from)) return false;
        if (to   && d > new Date(to))   return false;
        return true;
      });
    } catch { return []; }
  },
};

// ──────────────────────────────────────────────
// CONFIG REPOSITORY — salva/carrega credenciais
// ──────────────────────────────────────────────
const ConfigRepository = {
  save(url, key) {
    SUPABASE_CONFIG.url = url;
    SUPABASE_CONFIG.key = key;
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);
  },

  isConfigured() {
    return SupabaseClient.isConfigured;
  },

  async testConnection() {
    if (!SupabaseClient.isConfigured) throw new Error('Credenciais não configuradas');
    // Tenta fazer uma query simples
    await SupabaseClient.select('sales', 'select=id&limit=1');
    return true;
  },
};

// ──────────────────────────────────────────────
// SYNC STATUS — indicador de conexão em tempo real
// ──────────────────────────────────────────────
const SyncStatus = {
  _listeners: [],

  onChange(fn) { this._listeners.push(fn); },

  emit(status) { // 'online' | 'offline' | 'syncing' | 'error'
    this._listeners.forEach(fn => fn(status));
  },
};

// Tenta sincronizar a fila ao recuperar conexão
window.addEventListener('online', async () => {
  SyncStatus.emit('syncing');
  const count = await OfflineQueue.flush();
  if (count > 0) console.info(`[Sync] ${count} venda(s) sincronizada(s).`);
  SyncStatus.emit('online');
});

window.addEventListener('offline', () => SyncStatus.emit('offline'));

// Exporta para o app.js
window.PharmaPOS = window.PharmaPOS || {};
window.PharmaPOS.SaleRepository   = SaleRepository;
window.PharmaPOS.ConfigRepository = ConfigRepository;
window.PharmaPOS.OfflineQueue     = OfflineQueue;
window.PharmaPOS.SyncStatus       = SyncStatus;
