import { relations } from "drizzle-orm/relations";
import { 
	user,
	account, websites, projects, domains, eventMeta, subscriptions, userPreferences, twoFactor, session, auditLogs, funnelDefinitions, funnelGoals, apikey, organization, member, invitation, team
} from "./schema";


export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	websites: many(websites),
	subscriptions: many(subscriptions),
	userPreferences: many(userPreferences),
	twoFactors: many(twoFactor),
	sessions: many(session),
	auditLogs: many(auditLogs),
	domains: many(domains),
	funnelDefinitions: many(funnelDefinitions),
	apikeys: many(apikey),
	members: many(member),
	invitations: many(invitation),
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
	organization: one(organization, {
		fields: [websites.organizationId],
		references: [organization.id]
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
	organization: one(organization, {
		fields: [projects.organizationId],
		references: [organization.id]
	}),
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
	organization: one(organization, {
		fields: [domains.organizationId],
		references: [organization.id]
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
	organization: one(organization, {
		fields: [subscriptions.organizationId],
		references: [organization.id]
	})
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
	organization: one(organization, {
		fields: [session.activeOrganizationId],
		references: [organization.id]
	})
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	user: one(user, {
		fields: [auditLogs.userId],
		references: [user.id]
	}),
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

export const apikeyRelations = relations(apikey, ({one}) => ({
	user: one(user, {
		fields: [apikey.userId],
		references: [user.id]
	}),
}));

export const organizationRelations = relations(organization, ({many}) => ({
	members: many(member),
	invitations: many(invitation),
	teams: many(team),
	projects: many(projects),
	websites: many(websites),
	domains: many(domains),
	subscriptions: many(subscriptions),
}));

export const memberRelations = relations(member, ({one}) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [member.teamId],
		references: [team.id]
	}),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	}),
	inviter: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [invitation.teamId],
		references: [team.id]
	}),
}));

export const teamRelations = relations(team, ({one, many}) => ({
	organization: one(organization, {
		fields: [team.organizationId],
		references: [organization.id]
	}),
	members: many(member),
	invitations: many(invitation),
}));