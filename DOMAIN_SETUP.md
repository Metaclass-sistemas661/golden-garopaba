# 🏠 Golden Garopaba - Domain Configuration Checklist

## ✅ Configuração Completa do Domínio `goldengaropaba.com.br`

### 📁 Arquivos Atualizados

| Arquivo | Descrição |
|---------|-----------|
| `.env` | Adicionado `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_SITE_NAME` |
| `apphosting.yaml` | Configuração de variáveis de ambiente para produção |
| `next.config.ts` | Headers de segurança + redirect www → non-www |
| `firebase.json` | Domínios autorizados para autenticação |
| `src/app/layout.tsx` | Metadata SEO enterprise (Open Graph, Twitter, etc) |
| `src/app/robots.ts` | Arquivo robots.txt dinâmico |
| `src/app/sitemap.ts` | Sitemap XML dinâmico com todos os imóveis |
| `src/app/actions/auth.ts` | URL de redirect corrigida |
| `public/manifest.json` | PWA manifest |

---

## ⚠️ AÇÕES MANUAIS NECESSÁRIAS

### 1. 🖼️ Criar Imagem Open Graph
Crie uma imagem `og-image.jpg` (1200x630px) e salve em `/public/og-image.jpg`

Sugestão de conteúdo:
- Logo Golden Garopaba
- Imagem de uma mansão de luxo
- Texto: "Imóveis de Luxo em Garopaba"

### 2. 🔐 Firebase Console - Authorized Domains
Acesse: https://console.firebase.google.com/project/golden-garopaba2/authentication/settings

Adicione os domínios (se ainda não estiverem):
- `goldengaropaba.com.br`
- `www.goldengaropaba.com.br`

### 3. 🔐 Supabase - Redirect URLs
Acesse: https://supabase.com/dashboard → Project → Authentication → URL Configuration

Adicione às "Redirect URLs":
- `https://goldengaropaba.com.br/**`
- `https://www.goldengaropaba.com.br/**`

### 4. 📊 Google Search Console (Opcional - Recomendado)
1. Acesse: https://search.google.com/search-console
2. Adicione a propriedade `goldengaropaba.com.br`
3. Verifique via DNS TXT record
4. Submeta o sitemap: `https://goldengaropaba.com.br/sitemap.xml`

### 5. 🔒 SSL Certificate
Após verificar os registros DNS no Firebase:
- Clique em "Verificar registros"
- O certificado SSL será gerado automaticamente em 10-30 minutos

---

## 🚀 Deploy
Após as configurações manuais, faça o deploy:
```bash
git add .
git commit -m "feat: configure goldengaropaba.com.br domain (enterprise)"
git push
```

O Firebase App Hosting fará o deploy automaticamente.

---

## 🔗 URLs Finais
- **Produção**: https://goldengaropaba.com.br
- **Sitemap**: https://goldengaropaba.com.br/sitemap.xml
- **Robots**: https://goldengaropaba.com.br/robots.txt

---

*Configurado em: Setembro 2026*
