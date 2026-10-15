# nimfasele — نیم‌فاصله‌گذار خودکار فارسی

[![CI](https://github.com/alizamani1616/nimfasele/actions/workflows/ci.yml/badge.svg)](https://github.com/alizamani1616/nimfasele/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**nimfasele** («نیم‌فاصله») کتابخانه‌ای TypeScript با **صفر وابستگی runtime** برای اصلاح خودکار نیم‌فاصله (ZWNJ) در متن فارسی است؛ همراه با ابزار خط فرمان و API گزارش خطا با موقعیت مکانی دقیق.

> **Half-space (ZWNJ) fixer for Persian text** — zero-dependency TypeScript library with a CLI, positional issue reporting, and a linguistically-aware rule engine. English notes below.

🔗 **دموی زنده:** <https://alizamani1616.github.io/nimfasele/>

## چرا nimfasele؟

ابزارهای موجود معمولاً فقط چند قاعده سطحی دارند. nimfasele یک پایپ‌لاین کامل دارد:

- **پیش‌نرمال‌سازی:** `ي→ی`، `ك→ک`، فرم‌های presentation عربی → استاندارد، فشرده‌سازی فاصله‌ها
- **پیشوندها:** `می کرد` → `می‌کرد`، `نمی دانم` → `نمی‌دانم`، `بی دلیل` → `بی‌دلیل` — با استثناها (`می و مستی` دست‌نخورده می‌ماند)
- **پسوندها:** `کتاب ها` → `کتاب‌ها`، `بزرگ ترین` → `بزرگ‌ترین`
- **ضمایر پیوسته با قاعده زبان‌شناختی درست:**
  - بعد از مصوت/ه → با نیم‌فاصله: `خانه ام` → `خانه‌ام`
  - بعد از همخوان → چسبیدن کامل با حذف الف: `کتاب ام` → `کتابم`، `بود اند` → `بودند`
- **دیکشنری مرکب‌ها:** بیش از ۲۷۰ جفت‌واژه (`راه آهن` → `راه‌آهن`، `پیش بینی` → `پیش‌بینی`، `خانه به خانه` → `خانه‌به‌خانه`)
- **ترمیم ساختاری:** نیم‌فاصله‌های خراب کنار فاصله/علائم، نیم‌فاصله تکراری
- **تضمین idempotency:** `fix(fix(x)) === fix(x)` همیشه برقرار است (با fuzz تست می‌شود)
- **متن مرکب دست‌نخورده:** URL، ایمیل، اعداد فارسی/عربی/لاتین، ایموجی و ZWJ هرگز تغییر نمی‌کنند

## نصب

```bash
npm install nimfasele
```

نیازمندی: Node.js ≥ 18.

## استفاده (کتابخانه)

```ts
import {
  fixHalfSpace,
  findHalfSpaceIssues,
  hasHalfSpaceIssue,
  normalizePersian,
  ZWNJ,
} from 'nimfasele';

fixHalfSpace('من می روم به راه آهن');
// 'من می‌روم به راه‌آهن'

fixHalfSpace('خانه ام و کتاب ام');
// 'خانه‌ام و کتابم'

findHalfSpaceIssues('کتاب ها');
// [{ start: 4, end: 5, original: ' ', suggestion: '‌', rule: 'suffix' }]

hasHalfSpaceIssue('می کرد'); // true
```

همین API در CommonJS (بسته دوفرمته است: ESM + CJS):

```js
const { fixHalfSpace } = require('nimfasele');

fixHalfSpace('می کرد'); // 'می‌کرد'
```

### API

| تابع                                  | توضیح                                               |
| ------------------------------------- | --------------------------------------------------- |
| `fixHalfSpace(text, options?)`        | متن اصلاح‌شده را برمی‌گرداند                        |
| `addHalfSpaces`                       | نام مستعار `fixHalfSpace`                           |
| `findHalfSpaceIssues(text, options?)` | لیست ایرادها با `start`/`end` دقیقاً روی رشته ورودی |
| `hasHalfSpaceIssue(text, options?)`   | آیا ایراد نیم‌فاصله وجود دارد؟                      |
| `normalizePersian(text)`              | فقط نرمال‌سازی کاراکتری                             |
| `ZWNJ`                                | کاراکتر نیم‌فاصله (`\u200C`)                        |

`FixOptions` (همه پیش‌فرض `true`):

```ts
type FixOptions = {
  normalize?: boolean; // پیش‌نرمال‌سازی کاراکتری
  compounds?: boolean; // دیکشنری مرکب‌ها
  prefixes?: boolean; // می/نمی/بی
  suffixes?: boolean; // ها/تر/ترین + ضمایر پیوسته
  cleanup?: boolean; // ترمیم نیم‌فاصله‌های خراب
};
```

هر issue در `findHalfSpaceIssues` این شکل را دارد:

```ts
{
  start: number; // آفست شروع (روی همان رشته ورودی)
  end: number; // آفست پایان
  original: string; // = text.slice(start, end)
  suggestion: string; // جایگزین پیشنهادی
  rule: 'prefix' | 'suffix' | 'enclitic' | 'compound' | 'cleanup';
}
```

## استفاده (خط فرمان)

```bash
npx nimfasele file.txt              # چاپ متن اصلاح‌شده
cat file.txt | npx nimfasele       # ورودی از stdin
npx nimfasele file.txt -w          # بازنویسی درجا
npx nimfasele file.txt --check     # کد خروج ۱ اگر ایراد باشد (مناسب CI)
npx nimfasele file.txt --report    # لیست ایرادها با خط/ستون و نوع قاعده
```

فلگ‌ها: `-w/--write`، `--check`، `--report`، `--no-normalize`، `--no-compounds`، `-h/--help`، `-v/--version`.
کدهای خروج: `0` موفق / `1` ایراد پیدا شد (با `--check`) / `2` خطای استفاده یا IO.

> خروجی متن اصلاح‌شده روی **stdout** نوشته می‌شود؛ لیست `--report` و پیام `--check` روی **stderr** می‌روند تا پایپ کردن متن تمیز بماند (`npx nimfasele file.txt --report > fixed.txt` فقط متن اصلاح‌شده را ذخیره می‌کند).

## توسعه

```bash
npm install
npm run build        # dist دوفرمته ESM + CJS + تعریف نوع‌ها
npm test             # تست‌ها + گیت پوشاژ ≥ ۹۵٪
npm run lint         # ESLint
npm run format:check # Prettier
npm run demo:dev     # دموی زنده روی localhost
```

نمونه‌های واقعی متن در `tests/fixtures` و تست‌های داده‌محور روی کل دیکشنری اجرا می‌شوند؛ ورودی‌های تصادفی (fuzz با seed ثابت) idempotency و پایداری را تضمین می‌کنند.

## نقشه راه

- اکستنشن VSCode و مرورگر
- دیکشنری مرکب‌های بزرگ‌تر و قواعد پسوندی بیشتر (مانند `-گر`، `-بان`)
- پشتیبانی از زبان عربی
- غلط‌یاب املایی (خارج از هدف این کتابخانه است)

## English

**nimfasele** ("half-space") is a zero-runtime-dependency TypeScript library that automatically fixes Persian half-spaces (ZWNJ, U+200C): prefixes (می/نمی/بی), suffixes (ها/تر/ترین/…), enclitic pronouns with the correct vowel/consonant rule (خانه‌ام vs کتابم), a 270+ compound-word dictionary, and structural repair of broken ZWNJs — all idempotent, with URL/email/number/emoji safety and a positional issue-reporting API. Ships ESM + CJS + types (tsup), a CLI (`npx nimfasele`), and ≥95% test coverage (Vitest).

## مجوز

MIT — فایل [LICENSE](LICENSE).
