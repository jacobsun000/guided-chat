import { index, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const threads = sqliteTable(
  "threads",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    messagesJson: text("messages_json").notNull(),
    settingsJson: text("settings_json").notNull(),
  },
  (table) => [index("threads_updated_at_idx").on(table.updatedAt)]
)

export const workspaceSettings = sqliteTable("workspace_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
})
