import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import llm from "../configs/llm.js";
import roadmapPrompt from "../configs/roadmap.prompt.js";

function parseJsonFromLlm(text) {
    if (!text) return null;
    let str = typeof text === "string" ? text : JSON.stringify(text);

    // 1. Remove <think>...</think> reasoning blocks from Qwen / DeepSeek
    str = str.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // 2. Remove markdown code fences
    str = str.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

    // 3. Extract the outermost JSON object { ... }
    const startIdx = str.indexOf("{");
    const endIdx = str.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        str = str.substring(startIdx, endIdx + 1);
    }

    return JSON.parse(str);
}

const roadmapAgent = async (state) => {
    try {
        const resume = state.useResume && state.resume
            ? {
                skills: state.resume.skills || [],
                missingSkills: state.resume.missingSkills || [],
                projects: state.resume.projects || [],
                experience: state.resume.experience || "",
                score: state.resume.score || 0,
                suggestedRole: state.resume.suggestedRole || "",
                recommendations: state.resume.recommendations || [],
            }
            : null;

        const response = await llm.invoke([
            new SystemMessage(roadmapPrompt),
            new HumanMessage(`
Target Role:
${state.role}

Target Package:
${state.targetPackage}

Resume:
${JSON.stringify(resume, null, 2)}
`)
        ]);

        const rawContent = typeof response.content === "string" 
            ? response.content 
            : JSON.stringify(response.content);

        const roadmap = parseJsonFromLlm(rawContent);

        if (!roadmap) {
            throw new Error("Failed to parse valid JSON roadmap from AI response.");
        }

        // Validate and normalize level: ["Beginner", "Intermediate", "Advanced"]
        const validLevels = ["Beginner", "Intermediate", "Advanced"];
        let level = (roadmap.level || "Intermediate").toString().trim();
        level = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
        if (!validLevels.includes(level)) {
            if (/begin|basic|entry|easy/i.test(level)) level = "Beginner";
            else if (/adv|hard|expert/i.test(level)) level = "Advanced";
            else level = "Intermediate";
        }
        roadmap.level = level;

        // Ensure targetPackage, duration and title exist
        roadmap.title = roadmap.title || `${state.role} Roadmap`;
        roadmap.targetPackage = roadmap.targetPackage || state.targetPackage || "Standard";
        roadmap.duration = roadmap.duration || "3 Months";

        // Validate and normalize modules difficulty: ["Easy", "Medium", "Hard"]
        const validDiffs = ["Easy", "Medium", "Hard"];
        roadmap.modules = (roadmap.modules || []).map((module, idx) => {
            let diff = (module.difficulty || "Medium").toString().trim();
            diff = diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
            if (!validDiffs.includes(diff)) {
                if (/easy|begin|basic/i.test(diff)) diff = "Easy";
                else if (/hard|adv|difficult/i.test(diff)) diff = "Hard";
                else diff = "Medium";
            }
            return {
                title: module.title || `Module ${idx + 1}`,
                duration: module.duration || "1-2 Weeks",
                difficulty: diff,
                description: module.description || "Core concepts and hands-on skills.",
                youtube: module.youtube || "",
                article: module.article || "",
            };
        });

        return {
            ...state,
            roadmap,
        };
    } catch (error) {
        console.error("Roadmap Agent Error:", error.message);
        throw error;
    }
};

export default roadmapAgent;
