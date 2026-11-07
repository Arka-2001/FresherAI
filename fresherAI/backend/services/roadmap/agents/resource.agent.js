import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import llm from "../configs/llm.js";
import searchVideo from "../configs/youtube.js";

function parseJsonArray(text) {
    if (!text) return [];
    let str = typeof text === "string" ? text : JSON.stringify(text);
    str = str.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    str = str.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

    const startIdx = str.indexOf("[");
    const endIdx = str.lastIndexOf("]");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        str = str.substring(startIdx, endIdx + 1);
    }

    try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

const resourceAgent = async (state) => {
    try {
        const roadmap = state.roadmap;
        if (!roadmap || !Array.isArray(roadmap.modules) || roadmap.modules.length === 0) {
            return state;
        }

        const moduleTitles = roadmap.modules.map((m) => m.title).join("\n");

        let docs = [];
        try {
            const docsResponse = await llm.invoke([
                new SystemMessage(`
You are an expert software engineer.
For every module below, return the official documentation or best article link.
Return ONLY valid JSON format without explanations:
[
  {
    "title": "",
    "article": ""
  }
]
`),
                new HumanMessage(`Modules:\n${moduleTitles}`)
            ]);

            docs = parseJsonArray(docsResponse.content);
        } catch (err) {
            console.warn("⚠️ Failed to fetch doc links from LLM:", err.message);
            docs = [];
        }

        const docsMap = new Map();
        docs.forEach((item) => {
            if (item && item.title) {
                docsMap.set(item.title.toLowerCase().trim(), item.article || "");
            }
        });

        // Search YouTube for each module with graceful fallback
        roadmap.modules = await Promise.all(
            roadmap.modules.map(async (module) => {
                let video = null;
                try {
                    video = await searchVideo(module.title);
                } catch (err) {
                    console.warn(`⚠️ Video search failed for ${module.title}:`, err.message);
                }

                return {
                    ...module,
                    youtube: video?.url || "",
                    article: docsMap.get(module.title.toLowerCase().trim()) || module.article || "",
                };
            })
        );

        return {
            ...state,
            roadmap,
        };
    } catch (error) {
        console.error("Resource Agent Error:", error.message);
        return state;
    }
};

export default resourceAgent;
