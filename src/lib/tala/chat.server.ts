import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getOperationalContext, operationalContextPrompt } from "./operations-context";
import { runTalaText } from "./model-runtime";

const ChatInput = z.object({
  message: z.string().min(1).max(4000),
  apiKey: z.string().min(10),
  model: z.string().min(1),
});

export const talaOperationalChat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ChatInput.parse(data))
  .handler(async ({ data }) => {
    const { detectOperationalIntent } = await import("./operations-context");
    const intent = detectOperationalIntent(data.message);
    const context = await getOperationalContext(intent);

    if (intent === "none") {
      return {
        intent,
        reply: "I can currently answer operational questions about receivables, overdue invoices, billing-ready projects, customers, projects, suppliers, supplier POs, and alerts. Quote and lead actions are being connected next.",
      };
    }

    const reply = await runTalaText(
      { apiKey: data.apiKey, model: data.model },
      [
        { role: "system", content: operationalContextPrompt(context) },
        { role: "user", content: data.message },
      ],
    );

    return { intent, reply };
  });
