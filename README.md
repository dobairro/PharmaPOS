# 💊 PharmaPOS — Sistema de PDV Premium para Farmácia

PharmaPOS é um sistema de ponto de venda (PDV) moderno, rápido e resiliente, desenvolvido especificamente para farmácias. Ele combina uma interface estética de alta performance com a robustez do Supabase para persistência de dados na nuvem e suporte offline completo.

---

## ✨ Principais Funcionalidades

- **🚀 PDV de Alta Performance:** Interface fluida com suporte a leitor de código de barras.
- **🔍 Busca Inteligente:** Pesquisa instantânea por nome de produto, laboratório ou funcionalidade.
- **💰 Edição Dinâmica de Preços:** Altere o valor do produto manualmente antes ou depois de adicioná-lo ao carrinho.
- **☁️ Integração com Supabase:** Sincronização automática de vendas e transações diárias.
- **📵 Modo Offline-First:** Continue vendendo mesmo sem internet; o sistema enfileira as vendas e sincroniza automaticamente quando a conexão retornar.
- **📊 Relatórios Detalhados:** Visualize vendas diárias, ticket médio e exporte dados para análise.
- **⌨️ Atalhos de Teclado:** Operação ágil para o caixa (F2, F4, ESC).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, Vanilla JavaScript, CSS3 (Custom Properties).
- **Backend/DB:** Supabase (PostgreSQL).
- **Persistência Local:** LocalStorage & Offline Queue Logic.
- **Design:** Glassmorphism & Dark Mode Premium.

---

## 🚀 Como Configurar

1. **Repositório:** Clone este repositório para sua máquina local.
2. **Banco de Dados:**
   - Crie um projeto no [Supabase](https://supabase.com).
   - No SQL Editor, execute o conteúdo do arquivo `supabase_schema.sql` para criar as tabelas necessárias.
3. **Configuração da Chave:**
   - No app PharmaPOS, clique no botão **"Supabase"** no cabeçalho.
   - Insira sua **Project URL** e sua **Anon Public Key** (disponíveis em Settings > API).
   - Clique em **"Salvar e Conectar"**.

---

## ⌨️ Atalhos Rápidos

- **F2:** Foca no campo de busca/código de barras.
- **F4:** Finaliza a venda (abre modal de confirmação).
- **F5:** Gera relatório de vendas (no modal de relatórios).
- **ESC:** Limpa a busca ou fecha janelas modais.

---

## 📄 Licença

Este projeto foi desenvolvido para uso em sistemas de gestão de farmácias com foco em UX e confiabilidade.

---
*Desenvolvido por Marcelo Castro (dobairro/PharmaPOS)*
