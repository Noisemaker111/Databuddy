import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession, multiSession, twoFactor, organization, emailOTP } from "better-auth/plugins";
import { getSessionCookie } from "better-auth/cookies";
import { db } from "@databuddy/db";
import { Resend } from "resend";

const resend = new Resend(getEnv('RESEND_API_KEY'));

// Helper function to access environment variables in both Node.js and Cloudflare Workers
function getEnv(key: string) {
  return process.env[key] || 
         (typeof globalThis.process !== 'undefined' ? globalThis.process.env?.[key] : null) || 
         (typeof globalThis !== 'undefined' && key in globalThis ? (globalThis as any)[key] : null);
}

// Helper to check NODE_ENV
function isProduction() {
  const nodeEnv = getEnv('NODE_ENV');
  return nodeEnv === 'production';
}

export const canManageUsers = (role: string) => {
  return role === 'ADMIN'
}

export const getSession = async (request: any) => {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return null;
  }
  return sessionCookie;
}


export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "postgresql",
    }),
    appName: "databuddy.cc",
    cookie: {
        domain: isProduction() ? ".databuddy.cc" : undefined,
        secure: isProduction(),
        sameSite: "lax"
    },
    socialProviders: {
        google: {
            clientId: getEnv('GOOGLE_CLIENT_ID') as string,
            clientSecret: getEnv('GOOGLE_CLIENT_SECRET') as string,
        },
        github: { 
            clientId: getEnv('GITHUB_CLIENT_ID') as string,
            clientSecret: getEnv('GITHUB_CLIENT_SECRET') as string,
        },
    },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 32,
        autoSignIn: true,
        // requireEmailVerification: true,
        // sendResetPasswordEmail: true,
    },
    // emailVerification: {
    //     sendOnSignUp: true,
    //     sendVerificationOnSignUp: true,
    //     disableSignUp: true,
    //     sendVerificationOnSignIn: true,
    //     autoSignInAfterVerification: true,
    //     sendVerificationEmail: async ({user, url}: {user: any, url: string}) => {
    //         const resend = new Resend(process.env.RESEND_API_KEY as string);
    //         const email = await resend.emails.send({
    //             from: 'noreply@databuddy.cc',
    //             to: user.email,
    //             subject: 'Verify your email',
    //             html: `<p>Click <a href="${url}">here</a> to verify your email</p>`
    //         });
    //         console.log(email);
    //     }
    // },
    api: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // 5 minutes
        }
    },
    plugins: [
        customSession(async ({ user, session }) => {
            // Fetch the user's role from the database
            const dbUser = await db.user.findUnique({
                where: { id: user.id },
                select: { role: true, emailVerified: true }
            });
            
            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    emailVerified: user.emailVerified || false,
                    role: dbUser?.role || 'USER',
                },
                session: {
                    id: session.id,
                    role: dbUser?.role || 'USER',
                    expiresAt: session.expiresAt,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt,
                    ipAddress: session.ipAddress,
                    userAgent: session.userAgent,
                },
            }
        }),
        emailOTP({
            async sendVerificationOTP({email, otp, type}) {
                await resend.emails.send({
                    from: 'noreply@databuddy.cc',
                    to: email,
                    subject: 'Verify your email',
                    html: `<p>Your verification code is ${otp}</p>`
                })
            },
        }),
        twoFactor(),
        multiSession(),
        organization({
            teams: {
                enabled: true,
            },
            allowUserToCreateOrganization: true,
            organizationLimit: 1,
            membershipLimit: 100,
        }),
        // captcha({
        //     provider: "cloudflare-turnstile",
        //     secretKey: process.env.RECAPTCHA_SECRET_KEY as string,
        // })
    ]
})