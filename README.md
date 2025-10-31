# Despensa & Refeições — PWA local-first

App instalável (PWA), funciona offline, para gerir Despensa, Receitas, Sugestões e Lista de Compras.

## Como correr em local
1. Extraia este ZIP para uma pasta (ex.: `~/dispensa-pwa`).
2. No terminal nessa pasta:
   ```bash
   python3 -m http.server 5173
   ```
3. Abra `http://localhost:5173` no browser.
4. Clique em **Instalar** (Chrome/Edge) para ter como app.

> Importante: PWA precisa de http/https (não usar `file://`).

## Como instalar no telemóvel (deploy grátis)
### GitHub Pages
1. Crie um repositório e faça push destes ficheiros (na raiz).
2. Em *Settings → Pages*, ative *Deploy from Branch* (branch `main`, pasta `/`).
3. Aceda à URL pública e **Adicionar ao ecrã principal** no telemóvel.

### Netlify (drag & drop)
1. Acesse https://app.netlify.com/drop
2. Arraste a pasta (conteúdo do ZIP).

## Exportar / Importar dados
- Aba **Dados** → **Exportar JSON** para backup/sync manual.
- **Importar** permite carregar o ficheiro exportado.

## Estrutura
- `index.html` — UI + tabs
- `app.js` — lógica local (LocalStorage)
- `manifest.webmanifest` — metadados PWA
- `sw.js` — service worker (cache offline)
- `icons/` — ícones PWA

## Roadmap sugerido
- Scanner de código de barras (câmara).
- Unidades por ingrediente e auto-completar.
- Preferências dietéticas e filtros salvos.
- Plano por dia da semana, com doses por pessoa.
- Sincronização opcional (Supabase free tier).

## Licença
Uso pessoal livre.
