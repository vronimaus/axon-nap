import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run this
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all routines
    const routines = await base44.entities.Routine.list();
    
    if (!routines || routines.length === 0) {
      return Response.json({ error: 'No routines found' }, { status: 404 });
    }

    const results = [];

    for (const routine of routines) {
      // Check if already enriched
      if (routine.pre_routine_assessment && routine.post_routine_assessment && routine.expert_explanation) {
        results.push({ id: routine.id, status: 'already_enriched' });
        continue;
      }

      // Generate pre_routine_assessment based on category
      let preAssessment = '';
      let postAssessment = '';
      let expertExplanation = '';

      const category = routine.category;
      const difficulty = routine.difficulty || 'medium';
      const duration = routine.total_duration || 10;

      // Generate based on category
      switch (category) {
        case 'faszien':
          preAssessment = `Beweglichkeitstest: Führe die erste Übung aus und beobachte deine Bewegungsqualität. Notiere subjektiv von 1-10, wie mobil die Zielregion ist.`;
          postAssessment = `Vergleichstest: Wiederhole den Beweglichkeitstest und vergleiche mit der Ausgangslage. Typisch: +1-3 Punkte Mobilität direkt nach der Routine.`;
          expertExplanation = `Diese Faszien-Routine arbeitet nach dem Stecco-Prinzip: MFR löst Verspannungen in den faszial restrained areas, Neuro-Drills verankern neurologisch, Strength-Moves integrieren. Die biologische Schwelle für Faszien-Freigabe liegt bei 60-90 Sekunden pro Punkt. Pavels Rhythmus-Prinzip: regelmäßig und konsistent ist wichtiger als intensiv.`;
          break;
        case 'mobility':
          preAssessment = `Bewegungsumfang-Test: Testen Sie den aktuellen Bewegungsradius in der Zielregion (z.B. Schulterrotation, Hüftflexion). Markieren Sie mental oder notieren die Amplitude.`;
          postAssessment = `Post-Test: Wiederhole den Bewegungsumfang-Test. Messbar sollte hier eine deutliche Verbesserung zu sehen sein (+5-15° ROM).`;
          expertExplanation = `Mobilität nach Kelly Starrett: Position first, dann Kraft. Diese Routine fokussiert auf die "ten minute test" Ansätze und baut Joint-by-Joint Mobilität auf. Die Sequenz folgt dem Pattern: Tissue Quality → Mobilization → Activation → Integration.`;
          break;
        case 'neuro':
          preAssessment = `Neuro-Basis-Check: Gleichgewichtstest (auf einem Bein 30s halten), Fokus-Test (Augen-Tracking ohne Kopfbewegung). Notiere Stabilität und mentale Klarheit.`;
          postAssessment = `Post-Neuro-Test: Wiederhole Gleichgewicht und Augen-Tracking. Erwartung: merklich bessere Balance und schärferer visueller Fokus.`;
          expertExplanation = `Neurologische Routine basierend auf Vagus-Nerve Activation und vestibulär-okkulärem Reflex. Dan John nennt das "movement under control". Diese Routine re-kalibriert das zentrale Nervensystem und verbessert die propriozeptive Feedback-Schleife.`;
          break;
        case 'breathwork':
          preAssessment = `Atemqualitäts-Check: Normale Atemfrequenz messen (Atemzüge pro Minute), HRV-Baseline (Herzfrequenz-Variabilität subjektiv). Bewusstsein für Atemtiefe.`;
          postAssessment = `Post-Atem-Test: Atemfrequenz nochmals messen (sollte langsamer sein), HRV-Gefühl (sollte kohärent sein), mentale Klarheit (sollte erhöht sein).`;
          expertExplanation = `Atemwerk nach Wim-Hof und neurowissenschaftlichen Erkenntnissen. Das Zwerchfell ist der primäre Atemmuskel – wenn es richtig arbeitet, aktiviert es den Parasympathikus. Diese Routine nutzt rhythmisches Atmen und Retention zur vagalen Tonus-Optimierung.`;
          break;
        case 'funktionale-bewegung':
          preAssessment = `Funktionales Baseline: Führe eine einfache Bewegung aus, die die Routine trainiert (z.B. Air Squat, Lunge). Notiere Qualität und Muskelempfindung.`;
          postAssessment = `Funktionales Post-Test: Wiederhole die Baseline-Bewegung. Erwartung: bessere Bewegungsqualität, weniger Kompensationsmuster, mehr Kraft und Kontrolle.`;
          expertExplanation = `Funktionale Bewegung kombiniert Pavel (Strength unter Spannung), Dan John (Movement Complexity), und Kelly Starrett (Position before Power). Diese Routine baut echte Bewegungsmuster, nicht isolierte Muskeln, auf.`;
          break;
        default:
          preAssessment = `Baseline-Assessment: Beobachte deine aktuelle Bewegungsqualität und körperliches Gefühl vor der Routine.`;
          postAssessment = `Post-Routine-Vergleich: Vergleiche dein Gefühl und die Bewegungsqualität mit der Ausgangslage.`;
          expertExplanation = `Diese Routine kombiniert Faszien-, Neuro- und Kraft-Training für einen holistischen körperlichen Reset.`;
      }

      // Update routine
      await base44.entities.Routine.update(routine.id, {
        pre_routine_assessment: preAssessment,
        post_routine_assessment: postAssessment,
        expert_explanation: expertExplanation
      });

      results.push({ id: routine.id, status: 'enriched', category });
    }

    return Response.json({ 
      success: true, 
      routines_processed: results.length,
      details: results 
    });

  } catch (error) {
    console.error('Enrichment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});