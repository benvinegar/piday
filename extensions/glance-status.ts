import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { isToolCallEventType } from "@mariozechner/pi-coding-agent";

// Track glance session state
interface GlanceSession {
  url: string;
  createdAt: Date;
  status: "active" | "waiting" | "closed";
}

let currentSession: GlanceSession | null = null;
let widgetUpdateInterval: ReturnType<typeof setInterval> | null = null;

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h${minutes % 60}m`;
}

export default function (pi: ExtensionAPI) {
  // Update the widget with current glance status
  function updateWidget(ctx: any) {
    if (!ctx.hasUI) return;

    if (currentSession) {
      const age = Date.now() - currentSession.createdAt.getTime();
      const statusIcon = currentSession.status === "waiting" ? "⏳" : "📸";
      const statusText = currentSession.status === "waiting" ? "waiting" : "active";
      ctx.ui.setWidget({
        content: `${statusIcon} glance: ${formatDuration(age)} (${statusText})`,
        placement: "top-right",
      });
    } else {
      ctx.ui.setWidget({
        content: "📸 glance: idle",
        placement: "top-right",
      });
    }
  }

  // Listen for glance tool calls
  pi.on("tool_call", async (event, ctx) => {
    if (isToolCallEventType("glance", event)) {
      // Glance tool was invoked - create session tracking
      currentSession = {
        url: `https://glance.sh/...`, // URL would be extracted from event result
        createdAt: new Date(),
        status: "waiting",
      };
      updateWidget(ctx);
      
      ctx.ui.notify("📸 Glance session started", "info");
    }
    return undefined; // allow the tool call
  });

  // Register a tool to manually check/update glance status
  pi.registerTool({
    name: "glance_status",
    label: "GlanceStatus",
    description: "Check the current glance session status",
    parameters: {},

    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      if (!currentSession) {
        return {
          content: [{ type: "text", text: "No active glance session" }],
        };
      }

      const age = Date.now() - currentSession.createdAt.getTime();
      return {
        content: [{
          type: "text",
          text: `Glance session: ${currentSession.url} (${formatDuration(age)} ago, status: ${currentSession.status})`
        }],
      };
    },

    renderCall(_args, theme) {
      return new Text(theme.fg("toolTitle", theme.bold("Glance Status")), 0, 0);
    },

    renderResult(result, { expanded }, theme) {
      if (!expanded) {
        return new Text(theme.fg("muted", "Glance status checked"), 0, 0);
      }
      return new Text(theme.fg("success", result.content[0].text), 0, 0);
    },
  });

  // Register command to reset/clear glance session
  pi.registerCommand({
    name: "glance-reset",
    description: "Reset the current glance session tracking",

    async execute(_args, ctx) {
      currentSession = null;
      updateWidget(ctx);
      ctx.ui.notify("Glance session reset", "info");
    },
  });

  // Set up widget on session start
  pi.on("session_start", async (_event, ctx) => {
    updateWidget(ctx);

    // Update widget every second to show elapsed time
    if (widgetUpdateInterval) {
      clearInterval(widgetUpdateInterval);
    }

    widgetUpdateInterval = setInterval(() => {
      updateWidget(ctx);
    }, 1000);
  });

  // Clean up on session end
  pi.on("session_end", () => {
    if (widgetUpdateInterval) {
      clearInterval(widgetUpdateInterval);
      widgetUpdateInterval = null;
    }
    currentSession = null;
  });
}
