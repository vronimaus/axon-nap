import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { currentLevel, targetLevel, frequencyPerWeek } = body;

    // Validiere Eingaben
    if (!currentLevel || !targetLevel || !frequencyPerWeek) {
      return Response.json({
        error: 'Fehlende Parameter: currentLevel, targetLevel, frequencyPerWeek'
      }, { status: 400 });
    }

    // Pavel/DanJohn Progression: pro Woche ca. 1-2 Reps möglich
    // Bei 1x/week: ~0.5-1 Rep/Woche
    // Bei 2x/week: ~1-1.5 Reps/Woche
    // Bei 3-4x/week: ~1.5-2 Reps/Woche
    const repsPerWeek = frequencyPerWeek <= 1 ? 0.8 : frequencyPerWeek <= 2 ? 1.2 : 1.8;
    
    // Wie viele Reps braucht es?
    const repsToGain = targetLevel - currentLevel;

    if (repsToGain <= 0) {
      return Response.json({
        error: 'Ziel muss höher als aktuelles Level sein',
        isRealistic: false
      }, { status: 400 });
    }

    // Berechne Wochen
    let weeksNeeded = Math.ceil(repsToGain / repsPerWeek);

    // Minimum: 2 Wochen, Maximum: 16 Wochen (längere Plans sind unrealistisch)
    weeksNeeded = Math.max(2, Math.min(weeksNeeded, 16));

    // Bestimme Plan-Dauer (2, 4, 6, 8, 12 oder 16 Wochen)
    const planDurations = [2, 4, 6, 8, 12, 16];
    const recommendedDuration = planDurations.find(d => d >= weeksNeeded) || 16;

    // Ist das Ziel realistisch?
    const isRealistic = recommendedDuration <= 12; // Über 12 Wochen als "stretchy" markieren

    return Response.json({
      currentLevel,
      targetLevel,
      repsToGain,
      frequencyPerWeek,
      repsPerWeek: repsPerWeek.toFixed(1),
      weeksNeeded,
      recommendedDuration,
      isRealistic,
      message: isRealistic 
        ? `Realistisch in ${recommendedDuration} Wochen mit ${frequencyPerWeek}x/Woche`
        : `Ambitioniert! ${recommendedDuration} Wochen nötig, aber machbar mit Geduld`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});