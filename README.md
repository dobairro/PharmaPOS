# 💊 Farmácia do Bairro — Sistema de PDV Premium

**Farmácia do Bairro** é um sistema de ponto de venda (PDV) moderno, rápido e resiliente. Ele combina uma interface estética de alta performance com a robustez do Supabase para persistência de dados na nuvem e suporte offline completo.

---

## 🚀 Principais Funcionalidades

- **💎 Interface Premium:** Design moderno com modo escuro, animações suaves e foco na experiência do usuário.
- **🔍 Busca Inteligente:** Pesquisa instantânea por nome do produto ou categoria.
- **📷 Suporte a Scanner:** Leitura de códigos de barras para agilizar o atendimento.
- **📂 Importação de Estoque:** Atualize seus produtos via arquivos CSV com facilidade.
- **☁️ Sincronização Supabase:** Seus dados seguros na nuvem, acessíveis de qualquer lugar.
- **📴 Modo Offline:** Continue vendendo mesmo sem internet; os dados sincronizam automaticamente ao reconectar.
- **📊 Relatórios Detalhados:** Acompanhe o desempenho das vendas e exporte dados para análise.

## 🛠️ Tecnologias Utilizadas

- **HTML5 & CSS3** (Design System Customizado via CSS Variables)
- **JavaScript Moderno** (ES6+, LocalStorage, IndexedDB para Offline)
- **Supabase** (PostgreSQL Realtime, Auth, Storage)
- **Google Fonts** (Outfit para títulos, Inter para interface)

## 📦 Como Instalar Localmente

1. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/dobairro/FarmaciaDoBairro.git
   ```

2. **Abrir o index.html:**
   Simplesmente abra o arquivo `index.html` em seu navegador moderno preferido.

3. **Configurar Supabase (Opcional):**
   - Acesse **supabase.com** e crie um projeto gratuito.
   - Execute o script `supabase_schema.sql` no Editor SQL do seu projeto.
   - No app **Farmácia do Bairro**, clique no botão **"Supabase"** no cabeçalho.
   - Insira a **URL** e a **Anon Key** do seu projeto.

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se à vontade para expandir e adaptar conforme as necessidades da sua farmácia.

---
*Desenvolvido por Marcelo Castro (dobairro/Farmácia do Bairro)*

- **F2:** Foca no campo de busca/código de barras.
- **F4:** Finaliza a venda (abre modal de confirmação).
- **F5:** Gera relatório de vendas (no modal de relatórios).
---

## 📄 Licença

Este projeto foi desenvolvido para uso em sistemas de gestão de farmácias com foco em UX e confiabilidade.

---
*Desenvolvido por Marcelo Castro (dobairro/PharmaPOS)*
