import { findHalfSpaceIssues, fixHalfSpace, normalizePersian } from '../src/index.js';
import type { FixOptions, IssueRule } from '../src/index.js';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/700.css';
import './style.css';

const input = document.querySelector<HTMLTextAreaElement>('#input')!;
const output = document.querySelector<HTMLDivElement>('#output')!;
const stats = document.querySelector<HTMLDivElement>('#stats')!;

const RULE_LABELS: Record<IssueRule, string> = {
  prefix: 'پیشوند',
  suffix: 'پسوند',
  enclitic: 'ضمیر پیوسته',
  compound: 'مرکب',
  cleanup: 'ترمیم',
};

const SAMPLES: Record<string, string> = {
  prefixes: 'من می روم و نمی توانم بی دلیل بمانم. او می گفت که می آید.',
  suffixes: 'کتاب های بزرگ ترین کتابخانه ها را خواندم؛ خانه های شما گل های زیادی دارد.',
  compounds:
    'راه آهن و پیش بینی هوا: سفر با قطار های نیم ساعت به نشانی وب سایت شرکت انجام می شود.',
  broken: 'گفت: ‌سلام! این یک ‌اشتباه ساختاری است و کتاب‌ ‌ها هم خراب شده‌اند.',
  mixed:
    'برنامه را از https://example.com/download بگیر و به user@mail.com بگو قیمت ۱٬۵۰۰ تومان شد 🙂',
};

const options: FixOptions = { normalize: true, compounds: true };

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Apply the single-pass issues to the normalized copy, left to right. */
function applyOnce(
  text: string,
  issues: ReturnType<typeof findHalfSpaceIssues>,
): string {
  let out = '';
  let pos = 0;
  for (const issue of issues) {
    if (issue.start < pos) continue;
    out += text.slice(pos, issue.start) + issue.suggestion;
    pos = issue.end;
  }
  return out + text.slice(pos);
}

function render(text: string): void {
  const normalized = normalizePersian(text);
  const fixed = fixHalfSpace(text, options);
  const issues = findHalfSpaceIssues(normalized, { ...options, normalize: false });
  const counts: Record<IssueRule, number> = {
    prefix: 0,
    suffix: 0,
    enclitic: 0,
    compound: 0,
    cleanup: 0,
  };
  for (const issue of issues) counts[issue.rule]++;

  // Highlight per-issue only when a single pass fully explains the output;
  // otherwise show the real output without per-issue marks.
  const singlePass = applyOnce(normalized, issues);
  if (singlePass === fixed) {
    let html = '';
    let pos = 0;
    for (const issue of issues) {
      if (issue.start < pos) continue;
      html += escapeHtml(normalized.slice(pos, issue.start));
      const del = `<mark class="del">${escapeHtml(issue.original)}</mark>`;
      const ins = `<mark class="ins">${escapeHtml(issue.suggestion)}</mark>`;
      html += `<span class="fix" title="${RULE_LABELS[issue.rule]}">${del}${ins}</span>`;
      pos = issue.end;
    }
    html += escapeHtml(normalized.slice(pos));
    output.innerHTML = html;
  } else {
    output.innerHTML = escapeHtml(fixed);
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const parts = (Object.keys(counts) as IssueRule[])
    .filter((rule) => counts[rule] > 0)
    .map((rule) => `${RULE_LABELS[rule]}: ${counts[rule]}`);
  stats.innerHTML = total
    ? `<strong>${total}</strong> اصلاح — ${parts
        .map((p) => `<span class="chip">${escapeHtml(p)}</span>`)
        .join(' ')}`
    : 'ایرادی پیدا نشد؛ متن تمیز است ✅';
}

function update(): void {
  if (input.value.length === 0) {
    output.innerHTML = '<span class="empty">خروجی اینجا نمایش داده می‌شود…</span>';
    stats.textContent = '';
    return;
  }
  render(input.value);
}

input.addEventListener('input', update);
document
  .querySelectorAll<HTMLButtonElement>('button[data-sample]')
  .forEach((button) => {
    button.addEventListener('click', () => {
      input.value = SAMPLES[button.dataset.sample!] ?? '';
      update();
      input.focus();
    });
  });

input.value = SAMPLES.prefixes!;
update();
