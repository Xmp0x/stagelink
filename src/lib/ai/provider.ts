/**
 * StageLink AI Copilot — Model Provider Abstraction
 * 
 * Provides unified interface and zero-cost mock provider for local development,
 * CI/CD pipelines, and offline evaluation.
 */

import { type ToolDefinition } from "./tools";

export interface AiToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface AiMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: AiToolCall[];
  toolCallId?: string;
}

export interface AiResponse {
  content: string;
  toolCalls?: AiToolCall[];
}

export interface AiProvider {
  generateResponse(messages: AiMessage[], tools: ToolDefinition[]): Promise<AiResponse>;
}

/**
 * Deterministic Mock AI Provider
 * Simulates tool-calling LLM behavior accurately without external network or API costs.
 */
export class MockAiProvider implements AiProvider {
  async generateResponse(messages: AiMessage[], tools: ToolDefinition[]): Promise<AiResponse> {
    const lastMessage = messages[messages.length - 1];

    // If the last message is a tool response, synthesize tool results into final user answer
    if (lastMessage.role === "tool") {
      try {
        const parsed = JSON.parse(lastMessage.content);
        if (parsed.listings) {
          if (parsed.listings.length === 0) {
            return {
              content: "I checked our verified database and found 0 active internships matching your criteria at this moment. You can broaden your search or explore all active listings on the Explore page.",
            };
          }
          const listText = parsed.listings
            .map(
              (l: any) =>
                `• **[${l.title}](/internships/${l.id})** at **${l.company}**\n  📍 ${l.city} (${l.modality}) — ${l.durationWeeks} weeks ${l.isPaid ? "• Paid" : ""}\n  Required Skills: ${l.skills.join(", ") || "None specified"}`
            )
            .join("\n\n");
          return {
            content: `Here are the verified Moroccan internship opportunities matching your search:\n\n${listText}\n\nWould you like me to analyze your compatibility with any of these or draft a motivation note?`,
          };
        }

        if (parsed.matches) {
          if (parsed.matches.length === 0) {
            return {
              content: "I ran your profile through our explainable matching engine, but there are currently no published listings meeting your profile's mandatory criteria. Update your profile skills or check back soon as verified employers post new openings.",
            };
          }
          const matchText = parsed.matches
            .map(
              (m: any) =>
                `• **[${m.title}](/internships/${m.id})** at **${m.company}**\n  🎯 **${m.score}% Compatibility** (${m.isEligible ? "Eligible" : "Criteria Gaps"})\n  📍 ${m.city} (${m.modality})\n  ${m.summary}`
            )
            .join("\n\n");
          return {
            content: `Here are your top recommended matches calculated by the StageLink matching engine (v1.0.0):\n\n${matchText}\n\n*Note: Compatibility heuristic, not an employment guarantee. Would you like me to prepare an application draft for one of these?*`,
          };
        }

        if (parsed.applications) {
          if (parsed.applications.length === 0) {
            return {
              content: "You haven't submitted any applications yet. Browse verified offers on the [Explore Internships](/internships) page or ask me for your top matches to get started!",
            };
          }
          const appText = parsed.applications
            .map(
              (a: any) =>
                `• **${a.title}** at **${a.company}**\n  Status: \`${a.status}\` • Submitted on ${a.submittedAt}`
            )
            .join("\n\n");
          return {
            content: `Here is the current status of your submitted applications:\n\n${appText}\n\nYou can view full timelines and reviewer notes on your [My Applications](/student/applications) dashboard.`,
          };
        }

        if (parsed.draftCoverNote) {
          return {
            content: `Here is a personalized motivation note draft for the **${parsed.listingTitle}** position at **${parsed.companyName}**:\n\n\`\`\`\n${parsed.draftCoverNote}\n\`\`\`\n\n⚠️ **Action Required**: StageLink AI never automatically submits applications on your behalf. To apply, please review this draft, make any personal adjustments, and submit directly via the [Application Submission Page](/internships/${parsed.listingId}/apply).`,
          };
        }

        if (parsed.saved) {
          return {
            content: `✅ ${parsed.message} You can review all your saved positions anytime on your [Saved Opportunities](/student/saved) page.`,
          };
        }

        if (parsed.name) {
          return {
            content: `Here is your current StageLink profile summary:\n\n• **Name**: ${parsed.name}\n• **Location**: ${parsed.city || "Not specified"}\n• **Education**: ${parsed.education.join("; ") || "None on file"}\n• **Verified Skills**: ${parsed.skills.join(", ") || "None on file"}\n• **Languages**: ${parsed.languages.join(", ") || "None on file"}\n• **Profile Completeness**: ${parsed.completeness}%\n\nWould you like suggestions to improve your profile or find matching internships?`,
          };
        }
      } catch {
        // Fallback to raw text
      }
    }

    // Determine tool call intent from user prompt
    const userQuery = lastMessage.content.toLowerCase();

    // 1. Matches intent
    if (
      userQuery.includes("match") ||
      userQuery.includes("recommend") ||
      userQuery.includes("best fit") ||
      userQuery.includes("suited for me")
    ) {
      return {
        content: "Let me evaluate your profile against all active verified listings...",
        toolCalls: [
          {
            id: `call_${Date.now()}_matches`,
            name: "rankMyMatches",
            args: { limit: 5 },
          },
        ],
      };
    }

    // 2. Draft motivation note intent
    if (
      userQuery.includes("draft") ||
      userQuery.includes("cover note") ||
      userQuery.includes("cover letter") ||
      userQuery.includes("motivation") ||
      userQuery.includes("write an application")
    ) {
      // Look for a listing ID in the conversation history or prompt
      const idMatch = lastMessage.content.match(/[a-z0-9]{20,30}/i);
      const listingId = idMatch ? idMatch[0] : "cm1234567890abcdef";

      return {
        content: "I'll prepare a personalized motivation draft based on your verified skills and this opportunity's requirements...",
        toolCalls: [
          {
            id: `call_${Date.now()}_draft`,
            name: "prepareApplicationDraft",
            args: { listingId },
          },
        ],
      };
    }

    // 3. Search / Explore intent
    if (
      userQuery.includes("find") ||
      userQuery.includes("search") ||
      userQuery.includes("internship") ||
      userQuery.includes("casablanca") ||
      userQuery.includes("tangier") ||
      userQuery.includes("rabat") ||
      userQuery.includes("remote")
    ) {
      let city: string | undefined;
      if (userQuery.includes("casablanca") || userQuery.includes("casa")) city = "Casablanca";
      if (userQuery.includes("tangier") || userQuery.includes("tanger")) city = "Tangier";
      if (userQuery.includes("rabat")) city = "Rabat";

      let modality: string | undefined;
      if (userQuery.includes("remote")) modality = "REMOTE";
      if (userQuery.includes("hybrid")) modality = "HYBRID";
      if (userQuery.includes("onsite")) modality = "ONSITE";

      return {
        content: "Searching the verified StageLink database...",
        toolCalls: [
          {
            id: `call_${Date.now()}_search`,
            name: "searchPublishedInternships",
            args: { query: userQuery.replace(/find|search|internship|internships/gi, "").trim(), city, modality, limit: 5 },
          },
        ],
      };
    }

    // 4. Applications status intent
    if (
      userQuery.includes("application") ||
      userQuery.includes("status") ||
      userQuery.includes("my submissions")
    ) {
      return {
        content: "Retrieving your current application statuses from the database...",
        toolCalls: [
          {
            id: `call_${Date.now()}_apps`,
            name: "getMyApplications",
            args: {},
          },
        ],
      };
    }

    // 5. Profile check intent
    if (
      userQuery.includes("profile") ||
      userQuery.includes("my skills") ||
      userQuery.includes("my cv")
    ) {
      return {
        content: "Looking up your student profile and verified skills...",
        toolCalls: [
          {
            id: `call_${Date.now()}_profile`,
            name: "getMyProfile",
            args: {},
          },
        ],
      };
    }

    // Default conversational response
    return {
      content: `Hello! I am your **StageLink AI Copilot**, specialized in helping Moroccan students navigate authentic internship discovery.\n\nHere are some things I can do for you using our internal database:\n• **Find Opportunities**: *"Find React internships in Casablanca"* or *"Show remote internships"*\n• **Explainable Matches**: *"What are my top recommended matches?"*\n• **Application Drafting**: *"Draft a motivation note for my saved listing"*\n• **Application Tracking**: *"Check the status of my applications"*\n\nHow can I assist your internship search today?`,
    };
  }
}

/**
 * Returns the active AI provider based on environment configuration.
 */
export function getAiProvider(): AiProvider {
  const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  // By default in zero-cost mode or mock, use MockAiProvider
  return new MockAiProvider();
}
