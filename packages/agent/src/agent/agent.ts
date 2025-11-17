import * as z from "zod";
import { createAgent, initChatModel } from "langchain";
import {
  writeTool,
  searchReplaceTool,
  readFileTool,
  deleteTool,
  multiEditTool,
} from "./tools.js";
import { repositoryInitializationMiddleware } from "./middlewares/initialization.js";
import { afterModelCachingMiddleware } from "./middlewares/after-model.js";

const contextSchema = z.object({
  modelName: z.string(),
  sourcePath: z.string(),
  destinationPath: z.string(),
  projectId: z.string().optional(),
});

// Create and return the agent with the model and tools
export const createDaviaAgent = async (modelName: string) => {
  // Select the appropriate model based on the provider
  let modelString: string;

  switch (modelName) {
    case "anthropic":
      modelString = "claude-sonnet-4-5";
      break;
    case "openai":
      // Use MODEL environment variable if set, otherwise default to gpt-5
      const customModel = process.env.MODEL;
      modelString = customModel ? `openai:${customModel}` : "openai:gpt-5";
      
      // Note: base URL is configured via OPENAI_BASE_URL environment variable
      // which is set in checkAndSetAiEnv function
      // langchain's initChatModel automatically reads OPENAI_BASE_URL
      break;
    case "google":
      modelString = "google-genai:gemini-2.5-flash";
      break;
    default:
      throw new Error(`Unsupported model provider: ${modelName}`);
  }

  const model = await initChatModel(modelString);

  return createAgent({
    model,
    tools: [
      writeTool,
      searchReplaceTool,
      readFileTool,
      deleteTool,
      multiEditTool,
    ],
    middleware: [
      repositoryInitializationMiddleware,
      afterModelCachingMiddleware,
    ],
    contextSchema,
  });
};
