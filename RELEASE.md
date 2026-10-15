# چک‌لیست انتشار nimfasele

> این سند فقط چک‌لیست است — **هیچ مرحله‌ای از آن تا امروز اجرا نشده** (no push, no publish). هر مرحله را فقط وقتی خودتان خواستید و صریح اجرا کنید.

## پیش‌نیازها (همه لوکال، همین حالا آماده‌اند)

- [x] `npm test` — همه تست‌ها سبز، پوشاژ ≥ ۹۵٪
- [x] `npm run build` — ESM + CJS + d.ts بدون خطا
- [x] `npm run lint && npm run format:check && npm run typecheck` — تمیز
- [x] `npm pack --dry-run` — فقط `dist/` + `README.md` + `LICENSE` + `package.json` (۱۱ فایل، ۹۹٬۶۸۰ بایت فشرده / ۴۷۶ كیلوبایت باز‌شده)
- [x] `CHANGELOG.md` و `package.json` (v1.0.0) با changeset ساخته شدند

## انتشار روی npm (فقط با دستور شما)

1. `npm login` (حساب npm خودتان)
2. `npm publish` — پکیج `nimfasele@1.0.0` منتشر می‌شود
3. `npx nimfasele --version` در یک پوشه دیگر برای تأیید

## ساخت ریپوی گیت‌هاب و push (فقط با دستور شما)

1. ریپوی خالی `nimfasele` را در گیت‌هاب بسازید — **بدون** README/.gitignore/license (وگرنه اولین push غیر fast-forward می‌شود)
2. `git remote add origin https://github.com/alizamani1616/nimfasele.git`
3. `git push -u origin main`
4. در گیت‌هاب: Settings → Pages → Source = **GitHub Actions** (برای دموی زنده)
5. برای انتشار روی npm: secret با نام `NPM_TOKEN` در Settings → Secrets and variables → Actions بسازید
6. تگ انتشار: `git tag v1.0.0 && git push origin v1.0.0` → workflow «Release» اجرا می‌شود
   (فقط تگ‌هایی به شکل `v1.2.3` اجرا می‌شوند — نه هر تگ `v*`)

## دیپلوی دمو (فقط با دستور شما)

1. در گیت‌هاب: Settings → Pages → Source = **GitHub Actions**
2. push به main → workflow «Deploy demo to GitHub Pages» خودش `dist-demo` را منتشر می‌کند
3. یا همین حالا لوکال: `npm run demo:dev`

## بعد از انتشار

- [x] badge واقعی بیلد (CI) در README جایگزین badge لوکال شد
- [ ] پس از انتشار روی npm: badge نسخه npm هم اضافه شود
- [ ] برای تغییرات بعدی: `npx changeset` → کامیت → در ریلیز بعدی `npx changeset version`
