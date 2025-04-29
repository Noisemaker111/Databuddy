-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."ClientType" AS ENUM('INDIVIDUAL', 'COMPANY', 'NONPROFIT');--> statement-breakpoint
CREATE TYPE "public"."OrganizationRole" AS ENUM('ADMIN', 'OWNER', 'MEMBER', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."ProjectStatus" AS ENUM('ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."ProjectType" AS ENUM('WEBSITE', 'MOBILE_APP', 'DESKTOP_APP', 'API');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('ADMIN', 'OWNER', 'EDITOR', 'AUTHOR', 'VIEWER', 'USER');--> statement-breakpoint
CREATE TYPE "public"."SubscriptionStatus" AS ENUM('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'PAUSED', 'INCOMPLETE');--> statement-breakpoint
CREATE TYPE "public"."UserStatus" AS ENUM('ACTIVE', 'SUSPENDED', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."VerificationStatus" AS ENUM('PENDING', 'VERIFIED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."WebsiteStatus" AS ENUM('ACTIVE', 'HEALTHY', 'UNHEALTHY', 'INACTIVE', 'PENDING');--> statement-breakpoint
CREATE TABLE "Email" (
	"id" text PRIMARY KEY NOT NULL,
	"ipAddress" text,
	"email" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"website" text,
	"monthlyVisitors" integer,
	"message" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"repliedAt" timestamp(3),
	"status" text DEFAULT 'new' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"published" boolean DEFAULT false NOT NULL,
	"authorId" text NOT NULL,
	"coverImage" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"publishedAt" timestamp(3),
	"categoryId" text,
	"deletedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"createdAt" timestamp(3),
	"updatedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deletedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp(3),
	"refreshTokenExpiresAt" timestamp(3),
	"scope" text,
	"password" text,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "websites" (
	"id" text PRIMARY KEY NOT NULL,
	"domain" text NOT NULL,
	"name" text,
	"status" "WebsiteStatus" DEFAULT 'ACTIVE' NOT NULL,
	"userId" text,
	"projectId" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deletedAt" timestamp(3),
	"domainId" text
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deletedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"firstName" text,
	"lastName" text,
	"image" text,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"name" text,
	"password" text,
	"status" "UserStatus" DEFAULT 'ACTIVE' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deletedAt" timestamp(3),
	"role" "Role" DEFAULT 'USER' NOT NULL,
	"twoFactorEnabled" boolean
);
--> statement-breakpoint
CREATE TABLE "event_meta" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"data" jsonb,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"customerId" text,
	"priceId" text,
	"productId" text,
	"status" "SubscriptionStatus" DEFAULT 'ACTIVE' NOT NULL,
	"startsAt" timestamp(3),
	"endsAt" timestamp(3),
	"canceledAt" timestamp(3),
	"periodEventsCount" integer DEFAULT 0 NOT NULL,
	"periodEventsCountExceededAt" timestamp(3),
	"periodEventsLimit" integer DEFAULT 0 NOT NULL,
	"interval" text,
	"createdByUserId" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"type" "ProjectType" DEFAULT 'WEBSITE' NOT NULL,
	"clientId" text,
	"startDate" timestamp(3),
	"endDate" timestamp(3),
	"status" "ProjectStatus" DEFAULT 'ACTIVE' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deletedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "project_access" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"userId" text NOT NULL,
	"role" "Role" DEFAULT 'VIEWER' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deletedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"type" "ClientType" DEFAULT 'COMPANY' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deletedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"timezone" text DEFAULT 'auto' NOT NULL,
	"dateFormat" text DEFAULT 'MMM D, YYYY' NOT NULL,
	"timeFormat" text DEFAULT 'h:mm a' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "twoFactor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backupCodes" text NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"resourceType" text NOT NULL,
	"resourceId" text NOT NULL,
	"details" jsonb,
	"ipAddress" text,
	"userAgent" text,
	"userId" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"verificationStatus" "VerificationStatus" DEFAULT 'PENDING' NOT NULL,
	"verificationToken" text,
	"verifiedAt" timestamp(3),
	"userId" text,
	"projectId" text,
	"dnsRecords" jsonb,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deletedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "_PostToTag" (
	"A" text NOT NULL,
	"B" text NOT NULL,
	CONSTRAINT "_PostToTag_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "public"."domains"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_meta" ADD CONSTRAINT "event_meta_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_access" ADD CONSTRAINT "project_access_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_access" ADD CONSTRAINT "project_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "posts_authorId_idx" ON "posts" USING btree ("authorId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_key" ON "posts" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_key" ON "categories" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_key" ON "categories" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "websites_domainId_idx" ON "websites" USING btree ("domainId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "websites_domain_key" ON "websites" USING btree ("domain" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "websites_projectId_key" ON "websites" USING btree ("projectId" text_ops);--> statement-breakpoint
CREATE INDEX "websites_userId_idx" ON "websites" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "tags_name_key" ON "tags" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_key" ON "tags" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_key" ON "user" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "event_meta_projectId_idx" ON "event_meta" USING btree ("projectId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_organizationId_key" ON "subscriptions" USING btree ("organizationId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "project_access_projectId_userId_key" ON "project_access" USING btree ("projectId" text_ops,"userId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_key" ON "session" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON "audit_logs" USING btree ("resourceType" text_ops,"resourceId" text_ops);--> statement-breakpoint
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "domains_name_key" ON "domains" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "domains_projectId_idx" ON "domains" USING btree ("projectId" text_ops);--> statement-breakpoint
CREATE INDEX "domains_userId_idx" ON "domains" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "domains_verificationToken_key" ON "domains" USING btree ("verificationToken" text_ops);--> statement-breakpoint
CREATE INDEX "_PostToTag_B_index" ON "_PostToTag" USING btree ("B" text_ops);
*/