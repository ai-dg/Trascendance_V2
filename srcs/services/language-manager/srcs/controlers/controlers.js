import { app } from "../../server.js";



export async function get_user_lang_route(request, reply) {

    try {
        const token = request.cookies.token;
        if (!token) return reply.code(401).send({ success: false, message: "Not authenticated" });

        let payload;
        try {
            payload = verify(token, process.env.JWT_SECRET);
        } catch {
            return reply.code(401).send({ success: false, message: "Invalid token" });
        }

        userLang = await app.db.get("SELECT lang FROM user_lang WHERE user_id = ?", [payload.user_id]);

        return reply.send({ success: true, lang: userLang?.lang || "en" });
    } catch (err) {
        console.error("Database error: ", err);
        return reply.code(500).send ({ success: false, message: "Database error" });
    }
}


export async function set_user_lang_route(request, reply) {
    try {
        const token = request.cookies.token;
        if (!token) return reply.code(401).send({ success: false, message: "Not authenticated" });

        let payload;
        try {
            payload = verify(token, process.env.JWT_SECRET);
        } catch {
            return reply.code(401).send({ success: false, message: "Invalid token" });
        }
  
    const { lang } = request.body;

    if (!lang) {
      return reply.code(400).send({ success: false, message: "lang is required" });
    }
      const result = await app.db.run(
        "INSERT INTO user_lang(user_id, lang) VALUES(?, ?) ON CONFLICT(user_id) DO UPDATE SET lang = excluded.lang",
        [payload.user_id, lang]
      );
      return reply.send({ success: true, message: "Language updated", lang });
    } catch (err) {
      console.error("Database error:", err);
      return reply.code(500).send({ success: false, message: "Database error" });
    }
}

export async function create_user_lang_route(request, reply) {
    try {
    const { user_id, lang } = request.body;

    if (!user_id || !lang) {
      return reply.code(400).send({ success: false, message: "lang is required" });
    }
      await app.db.run(
        "INSERT INTO user_lang(user_id, lang) VALUES(?, ?) ON CONFLICT(user_id) DO UPDATE SET lang = excluded.lang",
        [user_id, lang]
      );
      return reply.send({ success: true, message: "Language updated", lang });
    } catch (err) {
      console.error("Lang database error:", err);
      return reply.code(500).send({ success: false, message: "Lang database error" });
    }
}


export async function delete_user_lang_route(request, reply) {
    try {
        const token = request.cookies.token;
        if (!token) return reply.code(401).send({ success: false, message: "Not authenticated" });

        let payload;
        try {
            payload = verify(token, process.env.JWT_SECRET);
        } catch {
            return reply.code(401).send({ success: false, message: "Invalid token" });
        }
  
      const result = await app.db.run(
        "DELETE FROM user_lang WHERE user_id = ?",
        [payload.user_id]
      );
      return reply.send({ success: true, message: "User deleted" });
    } catch (err) {
      console.error("DB error:", err);
      return reply.code(500).send({ success: false, message: "Database error" });
    }
}

