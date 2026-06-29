// Helper for opening WhatsApp click-to-chat with a prefilled Arabic message.
// No paid API, no API keys — uses the free wa.me link.
//
// Usage from a React component:
//   import { openWhatsappResult } from "../utils/whatsapp";
//   openWhatsappResult({
//     phone: currentUser.parentWhatsapp,
//     studentName: currentUser.name,
//     quizTitle: quiz.title,
//     score: 7,
//     total: 10,
//   });

export function buildResultMessage({ studentName, quizTitle, score, total }) {
  const safeScore = Number(score) || 0;
  const safeTotal = Number(total) || 0;
  const percent = safeTotal > 0 ? Math.round((safeScore / safeTotal) * 100) : 0;

  let grade = "ممتاز 🌟";
  if (percent < 50) grade = "يحتاج إلى مراجعة 📚";
  else if (percent < 70) grade = "جيد 👍";
  else if (percent < 85) grade = "جيد جدًا ✨";

  return [
    "🎓 *نتيجة اختبار جديدة*",
    "",
    `الطالب/ة: *${studentName || "—"}*`,
    `الاختبار: ${quizTitle || "—"}`,
    `الدرجة: *${safeScore} من ${safeTotal}* (${percent}%)`,
    `التقدير: ${grade}`,
    "",
    "تم إرسال هذه الرسالة من منصة الاختبارات.",
  ].join("\n");
}

export function buildWhatsappUrl({ phone, studentName, quizTitle, score, total }) {
  if (!phone) return null;
  const cleanPhone = String(phone).replace(/[^\d]/g, "");
  if (!cleanPhone) return null;
  const text = buildResultMessage({ studentName, quizTitle, score, total });
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function openWhatsappResult(params) {
  const url = buildWhatsappUrl(params);
  if (!url) {
    alert("رقم واتساب ولي الأمر غير متوفر. يرجى تحديثه من الملف الشخصي.");
    return false;
  }
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
