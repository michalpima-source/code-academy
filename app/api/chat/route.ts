import { convertToModelMessages, streamText, type UIMessage } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, lessonId, courseId, lessonTitle, courseTitle }: {
    messages: UIMessage[]
    lessonId?: string
    courseId?: string
    lessonTitle?: string
    courseTitle?: string
  } = await req.json()

  // Fetch transcript if we have a lessonId
  let transcript = ""
  if (lessonId) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
    )
    const { data } = await admin
      .from("lessons")
      .select("transcript")
      .eq("id", lessonId)
      .single()
    transcript = data?.transcript ?? ""
  }

  const baseInstructions = `אתה עוזר הוראה ידידותי ב-Code Academy.
כללי כתיבה חשובים:
- ענה תמיד בעברית ברורה ובגובה העיניים
- השתמש ב-Markdown לעיצוב: **מודגש**, \`קוד\`, רשימות עם -
- הוסף אימוג'ים רלוונטיים כדי להפוך את הלמידה לנעימה 😊
- קוד תמיד בבלוק \`\`\`language ... \`\`\`
- אל תוסיף ## כותרות גדולות בתשובות קצרות — השתמש בהן רק בהסברים ארוכים
- שמור על תשובות קצרות וממוקדות — אפשר תמיד להרחיב אם שואלים`

  let system = baseInstructions

  if (lessonTitle && courseTitle) {
    system = `${baseInstructions}

📚 **הקשר נוכחי:** התלמיד צופה בשיעור **"${lessonTitle}"** מהקורס **"${courseTitle}"**.
הנח שכל שאלה קשורה לחומר השיעור הזה אלא אם צוין אחרת.${
      transcript
        ? `\n\n📝 **תמלול השיעור:**\n${transcript.slice(0, 4000)}`
        : ""
    }`
  } else if (courseTitle) {
    system = `${baseInstructions}

📚 **הקשר נוכחי:** התלמיד לומד את הקורס **"${courseTitle}"**.`
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system,
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      if (!user) return
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")
      if (lastUserMsg && lessonId && courseId) {
        const content = lastUserMsg.parts
          ?.map((p: { type: string; text?: string }) => p.type === "text" ? p.text ?? "" : "")
          .join("") ?? ""
        await supabase.from("chat_messages").insert([
          { student_id: user.id, lesson_id: lessonId, course_id: courseId, role: "user", content },
          { student_id: user.id, lesson_id: lessonId, course_id: courseId, role: "assistant", content: text },
        ])
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
