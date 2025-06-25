import { betterAuth } from "better-auth";
import { db, eq, user } from "@databuddy/db";
import { getRedisCache } from "@databuddy/redis";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession, organization } from "better-auth/plugins";
import { ac, admin, member, owner } from "@databuddy/auth";
import { Resend } from "resend";

function isProduction() {
    return process.env.NODE_ENV === 'production';
}

const redisCache = getRedisCache();

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    security: {
        ipAddress: {
            ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
        }
    },
    appName: "databuddy.cc",
    advanced: {
        crossSubDomainCookies: {
            enabled: isProduction(),
            domain: ".databuddy.cc"
        },
        cookiePrefix: "databuddy",
        useSecureCookies: isProduction()
    },
    trustedOrigins: [
        'https://databuddy.cc',
        'https://app.databuddy.cc',
        'https://api.databuddy.cc'
    ],
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // 5 minutes
        }
    },
    secondaryStorage: {
        get: async (key) => {
            const value = await redisCache.get(key);
            return value ? value : null;
        },
        set: async (key, value, ttl) => {
            if (ttl) await redisCache.setex(key, ttl, value);
            else await redisCache.set(key, value);
        },
        delete: async (key) => {
            await redisCache.del(key);
        },
    },
    plugins: [
        customSession(async ({ user: sessionUser, session }) => {
            const [dbUser] = await db.query.user.findMany({
                where: eq(user.id, session.userId),
                columns: {
                    role: true,
                }
            });
            return {
                role: dbUser?.role,
                user: {
                    ...sessionUser,
                    role: dbUser?.role,
                },
                session
            };
        }),
        organization({
            creatorRole: "owner",
            teams: {
                enabled: false,
            },
            ac,
            roles: {
                owner,
                admin,
                member,
            },
            sendInvitationEmail: async ({ email, inviter, organization, invitation }) => {
                const resend = new Resend(process.env.RESEND_API_KEY as string);
                const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${invitation.id}`;
                await resend.emails.send({
                    from: 'noreply@databuddy.cc',
                    to: email,
                    subject: `You're invited to join ${organization.name}`,
                    html: `
                        <p>Hi there!</p>
                        <p>${inviter.user.name} has invited you to join <strong>${organization.name}</strong>.</p>
                        <p><a href="${invitationLink}">Click here to accept the invitation</a></p>
                        <p>This invitation will expire in 48 hours.</p>
                    `
                });
            }
        }),
    ]

})

export type User = (typeof auth)["$Infer"]["Session"]["user"];
export type Session = (typeof auth)["$Infer"]["Session"];
