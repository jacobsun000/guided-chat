import "server-only"

import { tool } from "ai"

import {
  createInitialUserMapState,
  getAvailableNodeIds,
  outputDependencyMapInputSchema,
  outputDependencyMapResultSchema,
  validateDependencyMap,
} from "@/lib/dependency-map"

export function createOutputDependencyMapTool() {
  return tool({
    description: "Render the validated dependency map before any answer or teaching content.",
    inputSchema: outputDependencyMapInputSchema,
    outputSchema: outputDependencyMapResultSchema,
    execute: async ({ dependency_map }) => {
      const validation = validateDependencyMap(dependency_map)
      if (!validation.valid) throw new Error(`Dependency map validation failed: ${validation.errors.join("; ")}`)
      const available = getAvailableNodeIds(dependency_map, createInitialUserMapState(dependency_map.map_id))
      return {
        map_id: dependency_map.map_id,
        rendered: true,
        available_node_ids: available,
        recommended_first_node_ids: dependency_map.recommended_first_node_ids.filter((id) => available.includes(id)),
        validation_warnings: validation.warnings.length ? validation.warnings : undefined,
      }
    },
  })
}

