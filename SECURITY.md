# سیاست امنیتی

## نسخه‌های پشتیبانی‌شده

| نسخه | پشتیبانی می‌شود |
| ---- | --------------- |
| 1.x  | ✅              |

## گزارش آسیب‌پذیری

لطفاً آسیب‌پذیری‌ها را در issue عمومی مطرح نکنید. از مسیر خصوصی گیت‌هاب استفاده کنید:

**Security → Report a vulnerability**

(اگر این گزینه در ریپو دیده نمی‌شود، ابتدا در Settings → Code security → Private vulnerability reporting آن را فعال کنید.)

هدف پاسخ اولیه: ۷ روز.

## دامنه

nimfasele یک کتابخانهٔ متن است و **هیچ وابستگی runtime** ندارد؛ سطح حملهٔ آن عمدتاً ورودی متن و ابزار خط فرمان است:

- خواندن یا نوشتن فایل خارج از مسیر داده‌شده (فلگ `-w`)
- بازنویسی مخرب یا از‌دست‌رفتن محتوای فایل
- مصرف بی‌رویهٔ حافظه/پردازنده روی ورودی بزرگ (مثلاً ReDoS در الگوهای پاک‌سازی)
- تغییر ناخواستهٔ متن‌های حساس (URL، ایمیل، کد) هنگام اصلاح نیم‌فاصله

## English

nimfasele is a zero-runtime-dependency text library. Please report vulnerabilities privately via GitHub's **Security → Report a vulnerability** flow rather than in a public issue. Initial response target: 7 days.
