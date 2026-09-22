import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/profile?device_id=xxx → single profile or null
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("device_id");
    if (!deviceId) {
      return NextResponse.json({ error: "device_id required" }, { status: 400 });
    }
    const res = await query<Record<string, unknown>>(
      `select * from public.user_profiles where device_id = $1 limit 1`,
      [deviceId]
    );
    return NextResponse.json({ profile: res.rows[0] ?? null });
  } catch (e) {
    console.error("GET /api/profile", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "db error" },
      { status: 500 }
    );
  }
}

// POST /api/profile → upsert by device_id
// body: full UserProfile payload incl. device_id
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const deviceId: string | undefined = body.device_id;
    if (!deviceId) {
      return NextResponse.json({ error: "device_id required" }, { status: 400 });
    }
    if (!body.role || !body.preferred_language || !body.full_name) {
      return NextResponse.json(
        { error: "role, preferred_language, full_name required" },
        { status: 400 }
      );
    }

    const res = await query<Record<string, unknown>>(
      `insert into public.user_profiles
        (device_id, role, preferred_language, full_name, location_name, district, state, pincode,
         latitude, longitude, business_stage, business_name, category, what_you_sell, business_idea,
         primary_goal, is_woman_entrepreneur, phone, buyer_preferences, profile_picture)
       values
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       on conflict (device_id) do update set
         role = excluded.role,
         preferred_language = excluded.preferred_language,
         full_name = excluded.full_name,
         location_name = excluded.location_name,
         district = excluded.district,
         state = excluded.state,
         pincode = excluded.pincode,
         latitude = excluded.latitude,
         longitude = excluded.longitude,
         business_stage = excluded.business_stage,
         business_name = excluded.business_name,
         category = excluded.category,
         what_you_sell = excluded.what_you_sell,
         business_idea = excluded.business_idea,
         primary_goal = excluded.primary_goal,
         is_woman_entrepreneur = excluded.is_woman_entrepreneur,
         phone = excluded.phone,
         buyer_preferences = excluded.buyer_preferences,
         profile_picture = excluded.profile_picture,
         updated_at = now()
       returning *`,
      [
        deviceId,
        body.role,
        body.preferred_language,
        (body.full_name as string).trim(),
        body.location_name ?? null,
        body.district ?? null,
        body.state ?? "Maharashtra",
        body.pincode ?? null,
        body.latitude ?? null,
        body.longitude ?? null,
        body.business_stage ?? null,
        body.business_name ?? null,
        body.category ?? null,
        body.what_you_sell ?? null,
        body.business_idea ?? null,
        body.primary_goal ?? null,
        body.is_woman_entrepreneur ?? false,
        body.phone ?? null,
        body.buyer_preferences ?? null,
        body.profile_picture ?? null,
      ]
    );
    return NextResponse.json({ profile: res.rows[0] });
  } catch (e) {
    console.error("POST /api/profile", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "db error" },
      { status: 500 }
    );
  }
}
