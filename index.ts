import type { Plugin } from "@opencode-ai/plugin"
import * as path from "path"

export const GrepOptimizerPlugin: Plugin = async ({ app, client, $ }) => {
  return {
    async "tool.execute.before"(input, output) {
      // Only handle grep tool
      if (input.tool !== "grep") return

      const args = output.args as {
        pattern: string
        path?: string
        include?: string
      }

      // Skip if no path specified
      if (!args.path) return

      try {
        // Check if the specified path exists and its type
        const file = Bun.file(args.path)
        if (await file.exists()) {
          const stat = await file.stat()
          
          if (stat.isFile() && args.include) {
            // Problem: include pattern with specific file makes no sense
            const fileExt = path.extname(args.path)
            const includeExt = args.include.replace('*', '')
            
            if (args.include.startsWith('*.') && fileExt === includeExt) {
              // Include pattern matches the file extension - remove redundant include
              delete args.include
            } else if (args.include.startsWith('*.') && fileExt !== includeExt) {
              // Include pattern doesn't match file extension - remove and search file anyway
              delete args.include
            } else {
              // Complex include pattern - remove it for single file
              delete args.include
            }
          }
        }
      } catch (error) {
        // Don't interfere with grep execution on unexpected errors
      }
    }
  }
}
