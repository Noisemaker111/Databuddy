/**
 * Common behavior rules applied to all agents.
 * These ensure consistent formatting and response patterns.
 */
export const COMMON_AGENT_RULES = `<behavior_rules>
- Call tools immediately without explanatory text
- Use parallel tool calls when possible
- Provide specific numbers and actionable insights
- Explain your reasoning
- Lead with the most important information first
- When presenting repeated structured data (lists of items, multiple entries, time series), always use markdown tables
- Tables make data scannable and easier to compare - use them for any data with 2+ rows
</behavior_rules>`;

/**
 * ClickHouse schema documentation - now imported from schema-docs.ts
 * This ensures the documentation is always up to date with the actual schema
 */
export { CLICKHOUSE_SCHEMA_DOCS } from "../config/schema-docs";
