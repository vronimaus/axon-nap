import { createClient } from 'npm:@base44/sdk@0.8.25';

/**
 * axonCalculateReadiness - Backend-Funktion für NMS-Integration
 * 
 * Diese Funktion wird von der NMS (NeuroMetabolic Suite) via asServiceRole aufgerufen.
 * Sie empfängt DailyContextCheck-Daten und berechnet/speichert den ReadinessCheck in Axon.
 * 
 * Erwarteter Payload von NMS:
 * {
 *   user_email: string,
 *   check_date: string (YYYY-MM-DD),
 *   feeling_hardware: number (1-10),
 *   focus_software: number (1-10),
 *   energy_battery: number (1-10),
 *   sleep_quality: number (1-10)
 * }
 */

Deno.serve(async (req) => {
  try {
    // Service-Role Client für cross-app Kommunikation
    const base44 = createClient({
      serviceRoleKey: Deno.env.get("BASE44_SERVICE_ROLE_KEY"),
      appId: Deno.env.get("BASE44_APP_ID")
    });

    // Payload validieren
    const payload = await req.json();
    const {
      user_email,
      check_date,
      feeling_hardware,
      focus_software,
      energy_battery,
      sleep_quality
    } = payload;

    // Erforderliche Felder prüfen
    if (!user_email || !check_date || !feeling_hardware || !focus_software || !energy_battery) {
      return Response.json({ 
        error: 'Fehlende erforderliche Felder: user_email, check_date, feeling_hardware, focus_software, energy_battery' 
      }, { status: 400 });
    }

    // Validiere Wertebereiche (1-10)
    const validateRange = (value, fieldName) => {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 10) {
        throw new Error(`${fieldName} muss eine Zahl zwischen 1 und 10 sein`);
      }
      return num;
    };

    const feeling = validateRange(feeling_hardware, 'feeling_hardware');
    const focus = validateRange(focus_software, 'focus_software');
    const energy = validateRange(energy_battery, 'energy_battery');
    const sleep = sleep_quality ? validateRange(sleep_quality, 'sleep_quality') : 5; // Default 5 wenn nicht angegeben

    // Readiness Score berechnen (Durchschnitt aller 4 Werte)
    const readiness_score = Math.round(((feeling + focus + energy + sleep) / 4) * 10) / 10;

    // Readiness Status bestimmen basierend auf Score und Minimum-Werten
    const minValue = Math.min(feeling, focus, energy, sleep);
    
    let readiness_status;
    if (readiness_score < 4 || minValue <= 2) {
      readiness_status = 'low';
    } else if (readiness_score < 6.5 || minValue <= 4) {
      readiness_status = 'moderate';
    } else {
      readiness_status = 'high';
    }

    // Prüfen ob bereits ein ReadinessCheck für heute existiert
    const existingChecks = await base44.entities.ReadinessCheck.filter({
      user_email,
      check_date
    });

    const checkData = {
      user_email,
      check_date,
      feeling_hardware: feeling,
      focus_software: focus,
      energy_battery: energy,
      sleep_quality: sleep,
      readiness_status,
      readiness_score
    };

    // Update oder Create
    if (existingChecks.length > 0) {
      await base44.entities.ReadinessCheck.update(existingChecks[0].id, checkData);
      console.log(`[axonCalculateReadiness] ReadinessCheck für ${user_email} am ${check_date} aktualisiert: ${readiness_status} (${readiness_score})`);
    } else {
      await base44.entities.ReadinessCheck.create(checkData);
      console.log(`[axonCalculateReadiness] ReadinessCheck für ${user_email} am ${check_date} erstellt: ${readiness_status} (${readiness_score})`);
    }

    return Response.json({
      success: true,
      readiness_status,
      readiness_score,
      check_date,
      message: 'ReadinessCheck erfolgreich berechnet und gespeichert'
    });

  } catch (error) {
    console.error('[axonCalculateReadiness] Error:', error.message);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});