-- ═══════════════════════════════════════════════════════
-- PharmaPOS — Schema Supabase (PostgreSQL)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ═══════════════════════════════════════════════════════

-- ──────────────────────────────────────────────
-- 1. TABELA: sales (cabeçalho da venda)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sales (
  id         BIGSERIAL PRIMARY KEY,
  local_id   TEXT,                         -- ID local do app (para deduplicação offline)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total      NUMERIC(10, 2) NOT NULL,
  qty        INTEGER NOT NULL DEFAULT 0,
  notes      TEXT
);

COMMENT ON TABLE  public.sales          IS 'Cabeçalho de cada venda registrada no PharmaPOS';
COMMENT ON COLUMN public.sales.local_id IS 'ID gerado offline, usado para evitar duplicatas ao sincronizar';

-- ──────────────────────────────────────────────
-- 2. TABELA: sale_items (itens de cada venda)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sale_items (
  id         BIGSERIAL PRIMARY KEY,
  sale_id    BIGINT NOT NULL REFERENCES public.sales (id) ON DELETE CASCADE,
  barcode    TEXT,
  name       TEXT NOT NULL,
  lab        TEXT,
  unit_price NUMERIC(10, 2) NOT NULL,
  qty        INTEGER NOT NULL DEFAULT 1,
  total      NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.sale_items IS 'Itens individuais de cada venda';

-- ──────────────────────────────────────────────
-- 3. ÍNDICES para performance
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS sales_created_at_idx  ON public.sales (created_at DESC);
CREATE INDEX IF NOT EXISTS sales_local_id_idx    ON public.sales (local_id);
CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx ON public.sale_items (sale_id);
CREATE INDEX IF NOT EXISTS sale_items_barcode_idx ON public.sale_items (barcode);

-- ──────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY (RLS)
-- Permite acesso público via anon key (app de caixa local)
-- Para ambientes multiusuário, ajuste conforme necessário.
-- ──────────────────────────────────────────────
ALTER TABLE public.sales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Política: qualquer usuário autenticado com anon key pode ler e escrever
CREATE POLICY "Acesso total via anon key" ON public.sales
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total via anon key" ON public.sale_items
  FOR ALL USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 5. VIEW: daily_summary (resumo das vendas por dia)
-- Facilita a geração de relatórios diários
-- ──────────────────────────────────────────────
CREATE OR REPLACE VIEW public.daily_summary AS
SELECT
  DATE(created_at AT TIME ZONE 'America/Sao_Paulo') AS sale_date,
  COUNT(*)                                           AS total_sales,
  SUM(qty)                                           AS total_items,
  SUM(total)                                         AS total_revenue,
  AVG(total)                                         AS avg_ticket
FROM public.sales
GROUP BY 1
ORDER BY 1 DESC;

COMMENT ON VIEW public.daily_summary IS 'Resumo diário de vendas — usado no relatório do PharmaPOS';

-- ──────────────────────────────────────────────
-- 6. FUNÇÃO: top_products (ranking de produtos mais vendidos)
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.top_products(
  p_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_to   DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  barcode    TEXT,
  name       TEXT,
  lab        TEXT,
  total_qty  BIGINT,
  total_revenue NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    si.barcode,
    si.name,
    si.lab,
    SUM(si.qty)::BIGINT   AS total_qty,
    SUM(si.total)         AS total_revenue
  FROM public.sale_items si
  JOIN public.sales s ON s.id = si.sale_id
  WHERE DATE(s.created_at AT TIME ZONE 'America/Sao_Paulo') BETWEEN p_from AND p_to
  GROUP BY si.barcode, si.name, si.lab
  ORDER BY total_qty DESC
  LIMIT 20;
$$;

COMMENT ON FUNCTION public.top_products IS 'Ranking dos 20 produtos mais vendidos em um período';
