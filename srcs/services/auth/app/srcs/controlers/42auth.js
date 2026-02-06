import { authData, fortytwoAuth, redis } from '../../server.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const { sign, verify } = jwt;

export async function oauth_login_route(request, reply) {
    // Build redirect URI dynamically from request host (supports localhost, LAN IP, domain)
    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const host = request.headers['x-forwarded-host'] || request.headers.host || 'localhost';
    const redirectUri = `${protocol}://${host}/auth/42/callback`;

    console.log('42 OAuth Login - Redirect URI:', redirectUri);
    console.log('Headers:', {
        'x-forwarded-proto': request.headers['x-forwarded-proto'],
        'x-forwarded-host': request.headers['x-forwarded-host'],
        'host': request.headers.host
    });

    // Store the redirect URI in a cookie so the callback can use the same one
    reply.setCookie('oauth_redirect_uri', redirectUri, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 300 // 5 minutes - enough for OAuth flow
    });

    const redirUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${fortytwoAuth.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    return reply.redirect(redirUrl);
}

export async function oauth_callback_route(request, reply) {

        const { code } = request.query;
        if (!code) return reply.status(400).send('Missing code');

        // Get the redirect URI from cookie (set during login) or construct from request
        const protocol = request.headers['x-forwarded-proto'] || 'http';
        const host = request.headers['x-forwarded-host'] || request.headers.host || 'localhost';
        const redirectUri = request.cookies.oauth_redirect_uri || `${protocol}://${host}/auth/42/callback`;

        // Clear the OAuth cookie
        reply.clearCookie('oauth_redirect_uri', { path: '/' });

        try {

            const params = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: fortytwoAuth.clientId,
                client_secret: fortytwoAuth.clientSecret,
                code,
                redirect_uri: redirectUri,
            });

            const tokenRes = await fetch('https://api.intra.42.fr/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });

            const tokenData = await tokenRes.json();
            console.log(tokenData);

            const userRes = await fetch('https://api.intra.42.fr/v2/me', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });

            const userData = await userRes.json();

            // console.log(userData);

            const db = request.server.db;

            let userId;
            const existingUser = await db.get(
                `SELECT * FROM users WHERE user_mail = ?`,
                [userData.email]
            );

            if (!existingUser) {
                const tempPassword = crypto.randomBytes(16).toString('hex');
                const result = await db.run(
                    `INSERT INTO users (user_mail, pseudo, user_password, avatar, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
                    [userData.email, userData.login, tempPassword, userData.image.versions.medium]
                );
                userId = result.lastID;
            } else {
                userId = existingUser.user_id;
            }

            await db.run(
                `UPDATE users SET pseudo = ?, user_mail = ?, avatar = ? WHERE user_id = ?`,
                [userData.login, userData.email, userData.image.versions.medium, userId]
            );

            const jti = crypto.randomBytes(16).toString('hex');
            const secretKey = authData.jwt;
            const payload = { user_id: userId, jti };
		    const token = sign(payload, secretKey, { expiresIn: '1h' });
		    await redis.set(`jwt:${jti}`, 'valid', { EX: 3600 });

            const sessionId = crypto.randomUUID();

            await redis.set(`session:user:${userId}`, sessionId, { EX: 3600 });

            const protocol = request.headers['x-forwarded-proto'] || (request.headers['x-forwarded-host']?.includes('443') ? 'https' : 'http');
            const isSecure = protocol === 'https';

            reply.setCookie('token', token, {
                path: '/' ,
                httpOnly: true,
                sameSite: 'lax'
            }).setCookie('sessionId', sessionId, {
                httpOnly: true,
                sameSite: isSecure ? 'none' : 'lax',
                secure: isSecure,
                path: '/',
                maxAge: 3600});

            // Redirect with oauth_success flag to clear session storage checking
            return reply.redirect('/?oauth_success=1');
        } catch (err) {
            console.error('42 auth error:', err);
            return reply.status(500).send('42 auth failed');
        }
}

export async function oauth_update_profile_route(request, reply) {
    try {
        const token = request.cookies.token;
        if (!token) return reply.status(401).send({ success: false, message: "Not authenticated"});

        const payload = verify(token, authData.jwt);
        const db = request.server.db;

        const user = await db.get('SELECT * FROM users WHERE user_id = ?', [payload.user_id]);
        if (!user) return reply.status(404).send({ success: false, message: "User not found"});

        const params = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: fortytwoAuth.clientId,
            client_secret: fortytwoAuth.clientSecret,
        });

        const tokenRes = await fetch('https://api.intra.42.fr/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const tokenData = await tokenRes.json();
        const userRes = await fetch(`https://api.intra.42.fr/v2/users/${user.pseudo}`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const userData = await userRes.json();

        await db.run(
            `UPDATE users SET pseudo = ?, user_mail = ?, avatar = ? WHERE user_id = ?`,
            [userData.login, userData.email, userData.image.versions.medium, user.user_id]
        );
        return reply.send({ sucess:true, message: 'Profile updated', data: { pseudo: userData.login, email: userData.email, avatar: userData.image.versions.medium } });
    } catch (err) {
        console.error('42 update profile error:', err);
        return reply.status(500).send({ success: false, message: "Failed to update 42 profile"});
    }
}
