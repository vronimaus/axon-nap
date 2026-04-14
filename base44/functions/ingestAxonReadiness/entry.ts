import { createClient } from 'npm:@base44/sdk@0.8.25';

/**
 * ingestAxonReadiness - NMS Ingest Endpoint für ReadinessCheck
 *
 * Dieser Endpoint wird von NMS nach dem Morning Check-in aufgerufen.
 * Er validiert den NMS_API_KEY und berechnet + speichert den ReadinessCheck.
 *
 * Authentifizierung: NMS_API_KEY im Authorization Header
 *   Authorization: Bearer <NMS_API_KEY>
 *
 * Payload von NMS (DailyContextCheck):
 * {
 *   user_email: string,
 *   check_date: string (YYYY-MM-DD),
 *   energy_level: number (1-10),       → energy_battery
 *   sleep_quality: number (1-10),      → sleep_quality
 *   focus_level: number (1-10),        → focus_software
 *   body_feeling: number (1-10)        → feeling_hardware
 * }
 *
 * Response:
 * {
 *   success: true,
 *   readiness_status: 'low' | 'moderate' | 'high',
 *   readiness_score: number,
 *   check_date: string
 * }
 */

Deno.serve(async (req) => {
  try {
    // 1. NMS_API_KEY validieren
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    const expectedKey = Deno.env.get('NMS_API_KEY');

    if (!expectedKey || token !== expectedKey) {
      console.warn('[ingestAxonReadiness] Unauthorized request');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Service-Role Client für Datenbankzugriff
    const base44 = createClient({
      serviceRoleKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY'),
      appId: Deno.env.get('BASE44_APP_ID')
    });

    // 3. Payload parsen und auf Axon-Felder mappen
    const body = await req.json();
    const {
      user_email,
      check_date,
      energy_level,
      sleep_quality,
      focus_level,
      body_feeling
    } = body;

    if (!user_email || !check_date) {
      return Response.json({ error: 'user_email und check_date sind erforderlich' }, { status: 400 });
    }

    // NMS-Feldnamen → Axon-Feldnamen
    const feeling_hardware = Number(body_feeling ?? 5);
    const focus_software   = Number(focus_level ?? 5);
    const energy_battery   = Number(energy_level ?? 5);
    const sleep            = Number(sleep_quality ?? 5);

    // Wertebereiche validieren (1–10)
    for (const [name, val] of [
      ['body_feeling', feeling_hardware],
      ['focus_level', focus_software],
      ['energy_level', energy_battery],
      ['sleep_quality', sleep]
    ]) {
      if (isNaN(val) || val < 1 || val > 10) {
        return Response.json({ error: `${name} muss zwischen 1 und 10 liegen` }, { status: 400 });
      }
    }

    // 4. Readiness Score & Status berechnen
    const readiness_score = Math.round(
      ((feeling_hardware + focus_software + energy_battery + sleep) / 4) * 10
    ) / 10;

    const minValue = Math.min(feeling_hardware, focus_software, energy_battery, sleep);
    let readiness_status;
    if (readiness_score < 4 || minValue <= 2) {
      readiness_status = 'low';
    } else if (readiness_score < 6.5 || minValue <= 4) {
      readiness_status = 'moderate';
    } else {
      readiness_status = 'high';
    }

    // 5. Bestehenden Check des Tages prüfen → Update oder Create
    const existing = await base44.asServiceRole.entities.ReadinessCheck.filter({
      user_email,
      check_date
    });

    const checkData = {
      user_email,
      check_date,
      feeling_hardware,
      focus_software,
      energy_battery,
      sleep_quality: sleep,
      readiness_status,
      readiness_score
    };

    if (existing.length > 0) {
      await base44.asServiceRole.entities.ReadinessCheck.update(existing[0].id, checkData);
      console.log(`[ingestAxonReadiness] Updated ReadinessCheck for ${user_email} on ${check_date}: ${readiness_status} (${readiness_score})`);
    } else {
      await base44.asServiceRole.entities.ReadinessCheck.create(checkData);
      console.log(`[ingestAxonReadiness] Created ReadinessCheck for ${user_email} on ${check_date}: ${readiness_status} (${readiness_score})`);
    }

    return Response.json({
      success: true,
      readiness_status,
      readiness_score,
      check_date
    });

  } catch (error) {
    console.error('[ingestAxonReadiness] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});