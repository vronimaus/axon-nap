import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EXERCISE_IMAGE_PROMPTS = [
  {
    exercise_id: "HIP_CARS",
    prompt: "Simple stick figure on pure black background. Basic white lines for body. Person standing with one leg. A glowing neon cyan (#00FFFF) circular arrow around the hip joint shows circular motion. No muscles, no anatomy, just clean schematic lines. Square 1:1, centered."
  },
  {
    exercise_id: "ANKLE_CARS",
    prompt: "Simple stick figure on black background. Basic white lines for body. Side view of foot and lower leg. A glowing neon cyan (#00FFFF) circular arrow around the ankle showing rotation. No anatomy, just clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "CAT_COW",
    prompt: "Simple stick figure on black background. Basic white lines. Side view of person on all fours. Two overlaid spine curves: one rounded up (cat), one arched down (cow), both highlighted in glowing neon cyan (#00FFFF). No muscles, just clean lines. Square 1:1, centered."
  },
  {
    exercise_id: "T_SPINE_ROTATION",
    prompt: "Simple stick figure on black background. Basic white lines. Person on all fours with one arm reaching up and rotating. Upper back/thoracic area highlighted in glowing neon magenta (#FF00FF). Rotation arrow. No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "COUCH_STRETCH",
    prompt: "Simple stick figure on black background. Basic white lines. Side view: person kneeling with rear leg shin vertical against wall. Front of rear thigh/hip highlighted with glowing neon cyan (#00FFFF) line. No muscles, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "FORWARD_FOLD",
    prompt: "Simple stick figure on black background. Basic white lines. Person standing, bending forward with straight legs. Back of legs and spine highlighted as glowing neon cyan (#00FFFF) line. No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "PIGEON_POSE",
    prompt: "Simple stick figure on black background. Basic white lines. Top view: person in pigeon pose, front leg bent, rear leg extended. Hip/glute area of front leg highlighted in glowing neon cyan (#00FFFF). No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "DOORWAY_STRETCH",
    prompt: "Simple stick figure on black background. Basic white lines. Person standing in doorframe, arms on frame, chest pushed forward. Chest area highlighted in glowing neon magenta (#FF00FF). No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "GLUTE_BRIDGE",
    prompt: "Simple stick figure on black background. Basic white lines. Side view: person lying on back, hips raised. Glutes and back of thighs highlighted in glowing neon cyan (#00FFFF). Upward arrow. No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "PLANK",
    prompt: "Simple stick figure on black background. Basic white lines. Side view: person in forearm plank. Entire body highlighted as straight glowing neon cyan (#00FFFF) line, core area brighter. No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "COPENHAGEN_PLANK",
    prompt: "Simple stick figure on black background. Basic white lines. Side view: person in side plank, upper leg resting on a simple white box (bench). Inner thigh of the UPPER leg (the one on the bench) highlighted in glowing neon cyan (#00FFFF). Lower leg lifted. No muscles, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "TIBIALIS_RAISE",
    prompt: "Simple stick figure on black background. Basic white lines. Person standing against wall, toes lifted up. Front of shin highlighted in glowing neon cyan (#00FFFF). No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "Y_RAISES",
    prompt: "Simple stick figure on black background. Basic white lines. Person lying face down, arms raised in Y-shape. Upper back between shoulder blades highlighted in glowing neon magenta (#FF00FF). No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "SEATED_GM",
    prompt: "Simple stick figure on black background. Basic white lines. Person sitting in wide straddle, torso hinged forward with straight back. Spine highlighted as straight glowing neon cyan (#00FFFF) line. No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "BOX_BREATHING",
    prompt: "Abstract diagram on pure black. Glowing neon cyan (#00FFFF) square with four arrows: up (inhale), right (hold), down (exhale), left (hold). Center shows '4-4-4-4' in neon magenta (#FF00FF). Clean, minimal. Square 1:1."
  },
  {
    exercise_id: "VERTICAL_SACCADES",
    prompt: "Simple diagram on black background. Two white outlined eyes. Two glowing neon magenta (#FF00FF) dots positioned vertically. Fast arrows between dots showing eye jumps. Clean, minimal. Square 1:1, centered."
  },
  {
    exercise_id: "CONVERGENCE",
    prompt: "Simple diagram on black background. Two white outlined eyes looking toward nose. Glowing neon magenta (#FF00FF) point near nose bridge, sight lines crossing. Clean, minimal. Square 1:1, centered."
  },
  {
    exercise_id: "TONGUE_ROOF",
    prompt: "Simple profile silhouette on black background. White outline of head. Tongue shown as glowing neon magenta (#FF00FF) shape pressed against upper palate. Clean, minimal. Square 1:1, centered."
  },
  {
    exercise_id: "FOOT_SENSORIK",
    prompt: "Simple diagram on black background. Bottom view of foot sole in white outline. Several glowing neon magenta (#FF00FF) circles on different areas. Small spiky ball symbol. Clean, minimal. Square 1:1, centered."
  },
  {
    exercise_id: "NERVE_GLIDE",
    prompt: "Simple stick figure on black background. Basic white lines. Person in T-pose, head tilted to one side, palm stretched away. Wavy glowing neon magenta (#FF00FF) line through arm showing nerve path. No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "PSOAS_STRETCH_SFL",
    prompt: "Simple stick figure on black background. Basic white lines. Side view: deep lunge, rear knee on ground, arms overhead. Front of rear hip/thigh highlighted in glowing neon cyan (#00FFFF). No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "CALF_RAISE_SBL",
    prompt: "Simple stick figure on black background. Basic white lines. Side view: person on edge of step, heels raised high. Calf area highlighted in glowing neon cyan (#00FFFF). Upward arrow. No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "HANGING_STRETCH_SBL",
    prompt: "Simple stick figure on black background. Basic white lines. Front view: person hanging from bar. Back of body from arms to legs highlighted in glowing neon cyan (#00FFFF). No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "SINGLE_LEG_HINGE_DFL",
    prompt: "Simple stick figure on black background. Basic white lines. Side view: person balanced on one leg, torso horizontal, rear leg extended back. Back of standing leg highlighted in glowing neon cyan (#00FFFF). No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "SIDE_STRETCH_LL",
    prompt: "Simple stick figure on black background. Basic white lines. Front view: person standing, one arm reaching overhead to side. Side of body highlighted in glowing neon magenta (#FF00FF). No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "SIDE_PLANK_LL",
    prompt: "Simple stick figure on black background. Basic white lines. Side view: person in side plank. Entire side of body highlighted in glowing neon magenta (#FF00FF). No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "THORACIC_ROTATION_SL",
    prompt: "Simple stick figure on black background. Basic white lines. Person on all fours, one hand behind head, rotating up. Spiral line from hips to shoulder in glowing neon cyan (#00FFFF). No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "WOOD_CHOP_SL",
    prompt: "Simple stick figure on black background. Basic white lines. Person performing diagonal chop from high to low. Spiral line from shoulder to opposite hip in glowing neon cyan (#00FFFF). No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "SUPINE_TWIST_SL",
    prompt: "Simple stick figure on black background. Basic white lines. Top view: person lying on back, knees to side, arms in T. Spiral line through torso in glowing neon magenta (#FF00FF). No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "FROG_STRETCH",
    prompt: "Simple stick figure on black background. Basic white lines. Top view: person in frog position, knees wide. Inner thighs highlighted in glowing neon cyan (#00FFFF). No anatomy, clean schematic. Square 1:1, centered."
  },
  {
    exercise_id: "BRIDGE",
    prompt: "Simple stick figure on black background. Basic white lines. Side view: person lying on back, hips raised in bridge. Front of body highlighted in glowing neon cyan (#00FFFF). No anatomy, clean schematic. Square 1:1, centered."
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { limit = 5, offset = 0 } = await req.json().catch(() => ({}));

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Generate images for limited batch
    const batch = EXERCISE_IMAGE_PROMPTS.slice(offset, offset + limit);
    
    for (const exerciseData of batch) {
      try {
        // Generate image
        const imageResult = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt: exerciseData.prompt
        });

        // Find exercise in database
        const exercises = await base44.asServiceRole.entities.Exercise.filter({
          exercise_id: exerciseData.exercise_id
        });

        if (exercises.length > 0) {
          const exercise = exercises[0];
          
          // Update with image URL
          await base44.asServiceRole.entities.Exercise.update(exercise.id, {
            image_url: imageResult.url
          });

          results.push({
            exercise_id: exerciseData.exercise_id,
            status: 'success',
            image_url: imageResult.url
          });
          successCount++;
        } else {
          results.push({
            exercise_id: exerciseData.exercise_id,
            status: 'not_found',
            message: 'Exercise not found in database'
          });
          errorCount++;
        }
      } catch (error) {
        results.push({
          exercise_id: exerciseData.exercise_id,
          status: 'error',
          message: error.message
        });
        errorCount++;
      }
    }

    return Response.json({
      success: true,
      summary: {
        total: EXERCISE_IMAGE_PROMPTS.length,
        processed: batch.length,
        offset: offset,
        successful: successCount,
        errors: errorCount,
        remaining: Math.max(0, EXERCISE_IMAGE_PROMPTS.length - offset - limit)
      },
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});