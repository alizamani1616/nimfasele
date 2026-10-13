# چک‌لیست انتشار nimfasele

> این سند فقط چک‌لیست است — **هیچ مرحله‌ای از آن تا امروز اجرا نشده** (no push, no publish). هر مرحله را فقط وقتی خودتان خواستید و صریح اجرا کنید.

## پیش‌نیازها (همه لوکال، همین حالا آماده‌اند)

- [x] `npm test` — همه تست‌ها سبز، پوشاژ ≥ ۹۵٪
- [x] `npm run build` — ESM + CJS + d.ts بدون خطا
- [x] `npm run lint && npm run format:check && npm run typecheck` — تمیز
- [x] `npm pack --dry-run` — فقط `dist/` + `README.md` + `LICENSE` + `package.json` (۱۱ فایل، ~۱۰۰KB)
- [x] `CHANGELOG.md` و `package.json` (v1.0.0) با changeset ساخته شدند

## انتشار روی npm (فقط با دستور شما)

1. `npm login` (حساب npm خودتان)
2. `npm publish` — پکیج `nimfasele@1.0.0` منتشر می‌شود
3. `npx nimfasele --version` در یک پوشه دیگر برای تأیید

## ساخت ریپوی گیت‌هاب و push (فقط با دستور شما)

1. ریپوی خالی `nimfasele` را در گیت‌هاب بسازید
2. `git remote add origin git@github.com:USER/nimfasele.git`
3. در `.changeset/config.json` و `README.md` ارجاع `OWNER/USER` را به نام کاربری خودتان تغییر دهید
4. `git push -u origin main`
5. تگ انتشار: `git tag v1.0.0 && git push --tags` → workflow «Release» اجرا می‌شود
   (نیازمند secret با نام `NPM_TOKEN` در تنظیمات ریپو)

## دیپلوی دمو (فقط با دستور شما)

1. در گیت‌هاب: Settings → Pages → Source = **GitHub Actions**
2. push به main → workflow «Deploy demo to GitHub Pages» خودش `dist-demo` را منتشر می‌کند
3. یا همین حالا لوکال: `npm run demo:dev`

## بعد از انتشار

- [ ] badges واقعی در README (npm version، CI status) جایگزین badgeهای لوکال شوند
- [ ] برای تغییرات بعدی: `npx changeset` → کامیت → در ریلیز بعدی `npx changeset version`
