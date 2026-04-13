import { createClient } from 'npm:@base44/sdk@0.8.25';

/**
 * axonGetBiologicalProtocols - Backend-Funktion für NMS-Integration
 * 
 * Diese Funktion wird von NMS via Service Role aufgerufen, um biologische Protokolle
 * basierend auf dem NMS-Kontext (Readiness, NMS-Zustand, Defizite) zu empfehlen.
 * 
 * Erwarteter Payload von NMS:
 * {
 *   user_email: string,
 *   readiness_status?: 'low' | 'moderate' | 'high',
 *   nms_state?: 'redline' | 'stressed' | 'solid' | 'peak' | 'vulnerable' | 'sluggish' | 'stuck' | 'weak_pain',
 *   dominant_deficit?: string (z.B. 'neural_calm', 'mobility', 'strength'),
 *   duration_preference?: number (max. Dauer in Minuten),
 *   protocol_type?: 'quick_session' | 'tune_up' | 'all'
 * }
 */

Deno.serve(async (req) => {
  try {
    // Service-Role Client für cross-app Kommunikation
    const base44 = createClient({
      serviceRoleKey: Deno.env.get("BASE44_SERVICE_ROLE_KEY"),
      appId: Deno.env.get("BASE44_APP_ID")
    });

    const payload = await req.json();
    const { 
      user_email, 
      readiness_status, 
      nms_state, 
      dominant_deficit, 
      duration_preference,
      protocol_type = 'all'
    } = payload;

    if (!user_email) {
      return Response.json({ error: 'user_email is required' }, { status: 400 });
    }

    const recommendedProtocols = {
      quickSessions: [],
      tuneUps: []
    };

    // 1. FitnessSnacks (Quick Sessions) abrufen
    if (protocol_type === 'quick_session' || protocol_type === 'all') {
      const allSnacks = await base44.asServiceRole.entities.FitnessSnack.filter({ is_active: true });
      
      const filteredSnacks = allSnacks.filter(snack => {
        // Readiness Gate Filter
        if (readiness_status && snack.readiness_gate && snack.readiness_gate !== 'any') {
          const readinessOrder = { low: 0, moderate: 1, high: 2 };
          const snackMinReadiness = readinessOrder[snack.readiness_gate] ?? 0;
          const userReadiness = readinessOrder[readiness_status] ?? 1;
          if (userReadiness < snackMinReadiness) return false;
        }
        
        // NMS Trigger Filter
        if (nms_state && snack.nms_trigger && Array.isArray(snack.nms_trigger)) {
          if (!snack.nms_trigger.includes(nms_state)) return false;
        }
        
        // Duration Filter
        if (duration_preference && snack.duration_minutes) {
          if (snack.duration_minutes > duration_preference) return false;
        }
        
        return true;
      });

      recommendedProtocols.quickSessions = filteredSnacks;
    }

    // 2. Routines (TuneUps) abrufen
    if (protocol_type === 'tune_up' || protocol_type === 'all') {
      const allRoutines = await base44.asServiceRole.entities.Routine.filter({});
      
      const filteredRoutines = allRoutines.filter(routine => {
        // Readiness Filter
        if (readiness_status && routine.min_readiness_status && routine.min_readiness_status !== 'any') {
          const readinessOrder = { red: 0, yellow: 1, green: 2 };
          const routineMinReadiness = readinessOrder[routine.min_readiness_status] ?? 0;
          const userReadiness = readinessOrder[readiness_status] ?? 1;
          if (userReadiness < routineMinReadiness) return false;
        }
        
        // NMS Trigger Filter
        if (nms_state && routine.nms_trigger && Array.isArray(routine.nms_trigger)) {
          if (!routine.nms_trigger.includes(nms_state)) return false;
        }
        
        // NMS Category Filter (dominant_deficit)
        if (dominant_deficit && routine.nms_category) {
          if (routine.nms_category !== dominant_deficit) return false;
        }
        
        return true;
      });

      recommendedProtocols.tuneUps = filteredRoutines;
    }

    console.log(`[axonGetBiologicalProtocols] Found ${recommendedProtocols.quickSessions.length} quick sessions and ${recommendedProtocols.tuneUps.length} tune ups for ${user_email}`);

    return Response.json({
      success: true,
      data: recommendedProtocols,
      metadata: {
        user_email,
        readiness_status,
        nms_state,
        dominant_deficit,
        protocol_type
      }
    });

  } catch (error) {
    console.error('[axonGetBiologicalProtocols] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});