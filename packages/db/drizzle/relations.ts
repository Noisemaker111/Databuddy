import { relations } from "drizzle-orm/relations";
import { user, posts, categories, account, websites, projects, domains, eventMeta, subscriptions, clients, projectAccess, userPreferences, twoFactor, session, auditLogs, postToTag, tags, funnelDefinitions, funnelGoals } from "./schema";

export const postsRelations = relations(posts, ({one, many}) => ({
	user: one(user, {
		fields: [posts.authorId],
		references: [user.id]
	}),
	category: one(categories, {
		fields: [posts.categoryId],
		references: [categories.id]
	}),
	postToTags: many(postToTag),
}));

export const userRelations = relations(user, ({many}) => ({
	posts: many(posts),
	accounts: many(account),
	websites: many(websites),
	subscriptions: many(subscriptions),
	projectAccesses: many(projectAccess),
	userPreferences: many(userPreferences),
	twoFactors: many(twoFactor),
	sessions: many(session),
	auditLogs: many(auditLogs),
	domains: many(domains),
	funnelDefinitions: many(funnelDefinitions),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	posts: many(posts),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const websitesRelations = relations(websites, ({one, many}) => ({
	user: one(user, {
		fields: [websites.userId],
		references: [user.id]
	}),
	project: one(projects, {
		fields: [websites.projectId],
		references: [projects.id]
	}),
	domain: one(domains, {
		fields: [websites.domainId],
		references: [domains.id]
	}),
	funnelDefinitions: many(funnelDefinitions),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	websites: many(websites),
	eventMetas: many(eventMeta),
	client: one(clients, {
		fields: [projects.clientId],
		references: [clients.id]
	}),
	projectAccesses: many(projectAccess),
	domains: many(domains),
}));

export const domainsRelations = relations(domains, ({one, many}) => ({
	websites: many(websites),
	user: one(user, {
		fields: [domains.userId],
		references: [user.id]
	}),
	project: one(projects, {
		fields: [domains.projectId],
		references: [projects.id]
	}),
}));

export const eventMetaRelations = relations(eventMeta, ({one}) => ({
	project: one(projects, {
		fields: [eventMeta.projectId],
		references: [projects.id]
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	user: one(user, {
		fields: [subscriptions.createdByUserId],
		references: [user.id]
	}),
}));

export const clientsRelations = relations(clients, ({many}) => ({
	projects: many(projects),
}));

export const projectAccessRelations = relations(projectAccess, ({one}) => ({
	project: one(projects, {
		fields: [projectAccess.projectId],
		references: [projects.id]
	}),
	user: one(user, {
		fields: [projectAccess.userId],
		references: [user.id]
	}),
}));

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	user: one(user, {
		fields: [userPreferences.userId],
		references: [user.id]
	}),
}));

export const twoFactorRelations = relations(twoFactor, ({one}) => ({
	user: one(user, {
		fields: [twoFactor.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	user: one(user, {
		fields: [auditLogs.userId],
		references: [user.id]
	}),
}));

export const postToTagRelations = relations(postToTag, ({one}) => ({
	post: one(posts, {
		fields: [postToTag.a],
		references: [posts.id]
	}),
	tag: one(tags, {
		fields: [postToTag.b],
		references: [tags.id]
	}),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	postToTags: many(postToTag),
}));

export const funnelDefinitionsRelations = relations(funnelDefinitions, ({one, many}) => ({
	website: one(websites, {
		fields: [funnelDefinitions.websiteId],
		references: [websites.id]
	}),
	createdByUser: one(user, {
		fields: [funnelDefinitions.createdBy],
		references: [user.id]
	}),
	goals: many(funnelGoals),
}));

export const funnelGoalsRelations = relations(funnelGoals, ({one}) => ({
	funnel: one(funnelDefinitions, {
		fields: [funnelGoals.funnelId],
		references: [funnelDefinitions.id]
	}),
}));