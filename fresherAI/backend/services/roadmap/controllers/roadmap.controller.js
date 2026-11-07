import redis from "../../../shared/redis/redis.js";
import graph from "../graph/roadmap.graph.js";
import Roadmap from "../models/roadmap.model.js";

export const generateRoadmap = async (req, res) => {
    try {
        const {
            role,
            targetPackage,
            useResume = false,
            resume,
        } = req.body;

        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID is required.",
            });
        }

        if (!role || !targetPackage) {
            return res.status(400).json({
                success: false,
                message: "Role and Target Package are required.",
            });
        }

        if (useResume && !resume) {
            return res.status(400).json({
                success: false,
                message: "Resume data is required when useResume is true.",
            });
        }

        const result = await graph.invoke({
            role,
            targetPackage,
            useResume,
            resume,
        });

        if (!result?.roadmap) {
            throw new Error("Roadmap generation agent did not return a valid roadmap.");
        }

        const roadmapData = {
            userId,
            title: result.roadmap.title || `${role} Career Roadmap`,
            targetPackage: result.roadmap.targetPackage || targetPackage,
            duration: result.roadmap.duration || "3 Months",
            level: result.roadmap.level || "Intermediate",
            modules: result.roadmap.modules || [],
        };

        const roadmap = await Roadmap.create(roadmapData);

        try {
            await redis.set(`roadmap:${roadmap._id}`, JSON.stringify(roadmap), "EX", 60 * 60);
            await redis.del(`userRoadmaps:${userId}`);
        } catch (cacheErr) {
            console.warn("⚠️ Redis cache error in generateRoadmap:", cacheErr.message);
        }

        return res.status(201).json({
            success: true,
            message: "Roadmap generated successfully.",
            data: roadmap,
        });

    } catch (error) {
        console.error("generateRoadmap error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate roadmap.",
        });
    }
};

export const getAllRoadmap = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        try {
            const cache = await redis.get(`userRoadmaps:${userId}`);
            if (cache) {
                return res.status(200).json({
                    success: true,
                    data: JSON.parse(cache),
                });
            }
        } catch (cacheErr) {
            console.warn("⚠️ Redis cache get error in getAllRoadmap:", cacheErr.message);
        }

        const roadmaps = await Roadmap.find({ userId }).sort({ createdAt: -1 });

        try {
            await redis.set(`userRoadmaps:${userId}`, JSON.stringify(roadmaps), "EX", 60 * 60);
        } catch {}

        return res.json({
            success: true,
            data: roadmaps,
        });
    } catch (error) {
        console.error("getAllRoadmap error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getRoadmapbyId = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.headers["x-user-id"];

        try {
            const cache = await redis.get(`roadmap:${id}`);
            if (cache) {
                return res.status(200).json({
                    success: true,
                    data: JSON.parse(cache),
                });
            }
        } catch {}

        const roadmap = await Roadmap.findOne({ _id: id, userId });

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found",
            });
        }

        try {
            await redis.set(`roadmap:${id}`, JSON.stringify(roadmap), "EX", 60 * 60);
        } catch {}

        return res.status(200).json({
            success: true,
            data: roadmap,
        });

    } catch (error) {
        console.error("getRoadmapbyId error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
