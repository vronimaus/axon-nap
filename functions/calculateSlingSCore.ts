import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      exercises = [],
      forDate = new Date().toISOString().split('T')[0]
    } = await req.json();

    if (!exercises || exercises.length === 0) {
      return Response.json(
        { error: 'No exercises provided for calculation' },
        { status: 400 }
      );
    }

    // Initialize sling scores
    let anteriorScore = 0;
    let posteriorScore = 0;
    let lateralScore = 0;
    const contributingExercises = [];

    // Process each exercise
    for (const exercise of exercises) {
      const { exercise_id, pain_nrs = 0 } = exercise;

      // Fetch full exercise data including smart tags
      const fullExercise = await base44.entities.Exercise.filter(
        { exercise_id }
      );

      if (!fullExercise || fullExercise.length === 0) {
        console.warn(`Exercise ${exercise_id} not found`);
        continue;
      }

      const ex = fullExercise[0];
      const smartTags = ex.smart_tags || {};
      const kinetics = smartTags.kinetic_chain_slings || {};

      // CRITICAL: Calculate Quality Factor based on NRS (AXON Formula)
      // Formula: Quality_Factor = (10 - NRS) / 10
      // At NRS 0: QF = 1.0 (perfect quality)
      // At NRS 5: QF = 0.5 (quality halved - significant pain disrupts integration)
      // At NRS 10: QF = 0.0 (no quality - exercise invalid)
      const qualityFactor = Math.max(0, (10 - pain_nrs) / 10);

      // Base score from progression level (1-10 scale, capped at 10)
      const baseScore = Math.min(ex.progression_level || 1, 10);

      // Calculate contribution weighted by quality
      const contribution = baseScore * qualityFactor;

      // Primary sling weight: 1.0
      // Secondary sling weight: 0.5
      const primarySling = kinetics.primary_sling;
      const secondarySlings = kinetics.secondary_slings || [];

      // Add to appropriate sling scores
      if (primarySling === 'anterior') {
        anteriorScore += contribution;
      } else if (primarySling === 'posterior') {
        posteriorScore += contribution;
      } else if (primarySling === 'lateral') {
        lateralScore += contribution;
      }

      // Add secondary sling contributions (50% weight)
      secondarySlings.forEach(sling => {
        const secondaryContribution = contribution * 0.5;
        if (sling === 'anterior') {
          anteriorScore += secondaryContribution;
        } else if (sling === 'posterior') {
          posteriorScore += secondaryContribution;
        } else if (sling === 'lateral') {
          lateralScore += secondaryContribution;
        }
      });

      // Log contribution
      contributingExercises.push({
        exercise_id: ex.exercise_id,
        exercise_name: ex.name,
        sling_type: primarySling,
        contribution_score: contribution,
        quality_factor: qualityFactor,
        pain_nrs: pain_nrs
      });
    }

    // Normalize scores to 0-10 scale
    // Each sling can theoretically reach 100 (10 points * 10 exercises)
    // We normalize to 0-10 scale with diminishing returns
    const normalizeScore = (score) => {
      // Use logarithmic scale to show progress but prevent infinite scaling
      // Formula: (log(score + 1) / log(101)) * 10
      if (score === 0) return 0;
      return Math.min(10, (Math.log(score + 1) / Math.log(101)) * 10);
    };

    const anterior = normalizeScore(anteriorScore);
    const posterior = normalizeScore(posteriorScore);
    const lateral = normalizeScore(lateralScore);

    // Determine overall readiness based on sling balance
    // Green: All slings >= 5, lateral >= 6
    // Yellow: One sling < 5, or imbalance > 2 points
    // Red: Multiple slings < 3
    const avgScore = (anterior + posterior + lateral) / 3;
    const imbalance = Math.max(anterior, posterior, lateral) - Math.min(anterior, posterior, lateral);

    let overallReadiness = 'green';
    if ((anterior < 3 || posterior < 3 || lateral < 3) || 
        (imbalance > 3 && avgScore < 4)) {
      overallReadiness = 'red';
    } else if ((anterior < 5 || posterior < 5) || imbalance > 2) {
      overallReadiness = 'yellow';
    }

    // Get previous day's scores for trend calculation
    const previousScores = await base44.entities.SlingProgress.filter(
      {
        user_email: user.email
      },
      '-created_date',
      1
    );

    const trend = {};
    if (previousScores && previousScores.length > 0) {
      const prev = previousScores[0];
      trend.anterior_trend = parseFloat((anterior - prev.anterior_score).toFixed(2));
      trend.posterior_trend = parseFloat((posterior - prev.posterior_score).toFixed(2));
      trend.lateral_trend = parseFloat((lateral - prev.lateral_score).toFixed(2));
    } else {
      trend.anterior_trend = 0;
      trend.posterior_trend = 0;
      trend.lateral_trend = 0;
    }

    // Create SlingProgress record
    const slingProgress = {
      user_email: user.email,
      date: forDate,
      timestamp: new Date().toISOString(),
      anterior_score: parseFloat(anterior.toFixed(2)),
      posterior_score: parseFloat(posterior.toFixed(2)),
      lateral_score: parseFloat(lateral.toFixed(2)),
      overall_readiness: overallReadiness,
      contributing_exercises: contributingExercises,
      trend,
      session_count: exercises.length
    };

    // Save to database
    await base44.entities.SlingProgress.create(slingProgress);

    // Track event
    base44.analytics.track({
      eventName: 'sling_score_calculated',
      properties: {
        anterior: anterior,
        posterior: posterior,
        lateral: lateral,
        overall_readiness: overallReadiness,
        exercise_count: exercises.length
      }
    });

    return Response.json({
      success: true,
      slingScore: {
        anterior: parseFloat(anterior.toFixed(2)),
        posterior: parseFloat(posterior.toFixed(2)),
        lateral: parseFloat(lateral.toFixed(2)),
        overallReadiness,
        imbalance: parseFloat(imbalance.toFixed(2))
      },
      trend,
      contributing_exercises: contributingExercises,
      message: `Sling-Scores berechnet: Anterior ${anterior.toFixed(1)}, Posterior ${posterior.toFixed(1)}, Lateral ${lateral.toFixed(1)}`
    });
  } catch (error) {
    console.error('Calculate Sling Score Error:', error);
    return Response.json(
      { error: error.message || 'Failed to calculate sling score' },
      { status: 500 }
    );
  }
});