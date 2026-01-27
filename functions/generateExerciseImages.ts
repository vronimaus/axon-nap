import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EXERCISE_IMAGE_PROMPTS = [
  {
    exercise_id: "HIP_CARS",
    prompt: "Technical line art illustration on pure black background (#000000). Human pelvis and hip joint in minimal neon cyan (#00FFFF) linework. A glowing cyan circular arrow shows the complete circular range of motion of the femur bone rotating in the hip socket. Medical schematic style, minimalist, digital, clean composition, square format 1:1, centered. No shading, only precise glowing lines."
  },
  {
    exercise_id: "ANKLE_CARS",
    prompt: "Minimalist technical line art on pure black background. Human foot and ankle joint drawn in neon cyan (#00FFFF) precise lines. A circular cyan arrow wraps around the toes showing ankle rotation movement. Medical diagram style, clean, digital, square 1:1 format, centered, no shadows."
  },
  {
    exercise_id: "CAT_COW",
    prompt: "Technical line art on black background. Two overlaid stick figure profiles on all fours. One shows rounded 'cat' spine curve, other shows arched 'cow' spine curve. Both spinal lines glow in neon cyan (#00FFFF). Minimal medical schematic style, clean composition, square 1:1, centered."
  },
  {
    exercise_id: "T_SPINE_ROTATION",
    prompt: "Line art illustration on pure black background. Kneeling person rotating upper body toward ceiling. Thoracic spine highlighted with glowing neon magenta/purple (#FF00FF). Cyan arrow shows rotation direction. Technical medical style, minimalist, digital, square format, centered."
  },
  {
    exercise_id: "COUCH_STRETCH",
    prompt: "Side view technical line art on black background. Kneeling person with rear shin against wall. Thick glowing neon cyan (#00FFFF) line emphasizes the stretch along front of rear thigh and hip flexor. Minimal medical diagram style, clean, square 1:1, centered."
  },
  {
    exercise_id: "FORWARD_FOLD",
    prompt: "Technical line art on pure black. Standing person folding forward with straight legs. Entire posterior chain (back of legs and spine) rendered as glowing neon cyan (#00FFFF) line. Medical schematic style, minimalist, digital, square format, centered."
  },
  {
    exercise_id: "PIGEON_POSE",
    prompt: "Top-down or slight angle view technical line art on black. Pigeon pose on ground. Front bent leg and glute muscles highlighted in glowing neon cyan (#00FFFF). Minimal medical diagram, clean composition, square 1:1, centered."
  },
  {
    exercise_id: "DOORWAY_STRETCH",
    prompt: "Line art on black background. Person standing in doorframe with arms at sides, chest pushed forward. Glowing neon magenta/purple (#FF00FF) lines show opening of chest muscles. Technical medical style, minimalist, square format, centered."
  },
  {
    exercise_id: "GLUTE_BRIDGE",
    prompt: "Technical line art on pure black. Person lying on back with pelvis raised maximally toward ceiling. Glute muscles and rear thighs glow intensely in neon cyan (#00FFFF). Upward force arrow. Medical schematic style, clean, square 1:1, centered."
  },
  {
    exercise_id: "PLANK",
    prompt: "Line art on black background. Perfect forearm plank position. Entire body forms straight glowing neon cyan (#00FFFF) line from head to feet, core area glows particularly bright. Minimal medical diagram, square format, centered."
  },
  {
    exercise_id: "COPENHAGEN_PLANK",
    prompt: "Technical line art on pure black. Side plank with upper leg elevated on platform. Inner thigh (adductors) of upper leg highlighted as thick glowing neon cyan (#00FFFF) line. Medical schematic style, minimalist, square 1:1, centered."
  },
  {
    exercise_id: "TIBIALIS_RAISE",
    prompt: "Line art on black. Person standing with back to wall, toes lifted maximally upward. Front shin muscles (tibialis anterior) glow in neon cyan (#00FFFF). Technical medical style, clean, square format, centered."
  },
  {
    exercise_id: "Y_RAISES",
    prompt: "Technical line art on pure black. Person lying prone with arms forming Y-shape upward. Muscles between shoulder blades and lower trapezius emphasized with glowing neon magenta/purple (#FF00FF). Minimal medical diagram, square 1:1, centered."
  },
  {
    exercise_id: "SEATED_GM",
    prompt: "Line art on black background. Person in wide straddle sit, perfectly straight torso hinged forward at hips. Spine shown as straight glowing neon cyan (#00FFFF) line, hinge symbol at hip joint. Medical schematic style, square format, centered."
  },
  {
    exercise_id: "BOX_BREATHING",
    prompt: "Abstract technical diagram on pure black. Glowing square made of light. Four arrows form breathing cycle: inhale (up), hold (right), exhale (down), hold (left). Center displays '4-4-4-4' in neon magenta/purple (#FF00FF). Minimal, digital, square 1:1."
  },
  {
    exercise_id: "VERTICAL_SACCADES",
    prompt: "Extreme close-up technical line art on black. Two eyes in minimal linework. Two glowing neon magenta/purple (#FF00FF) dots positioned vertically above each other. Fast arrows show saccadic eye jumps between dots. Medical diagram style, square format, centered."
  },
  {
    exercise_id: "CONVERGENCE",
    prompt: "Close-up line art on pure black. Eyes converging toward nose. Glowing neon magenta/purple (#FF00FF) point approaching nose bridge, sight lines crossing there. Technical medical style, minimalist, square 1:1, centered."
  },
  {
    exercise_id: "TONGUE_ROOF",
    prompt: "Stylized profile cross-section of human head on black background. Tongue rendered as glowing neon magenta/purple (#FF00FF) mass pressing flat and firm against upper palate. Technical medical diagram, minimal line art, square format, centered."
  },
  {
    exercise_id: "FOOT_SENSORIK",
    prompt: "Technical line art on pure black. Bottom view of foot sole. Various areas marked with pulsing neon magenta/purple (#FF00FF) circles. Subtle spiky ball symbol indicated. Medical diagram style, minimalist, square 1:1, centered."
  },
  {
    exercise_id: "NERVE_GLIDE",
    prompt: "Line art on black background. Person in T-pose with head tilted to opposite side, palm stretched away. Median nerve path through arm to fingers shown as wavy glowing neon magenta/purple (#FF00FF) line. Technical medical style, square format, centered."
  },
  {
    exercise_id: "PSOAS_STRETCH_SFL",
    prompt: "Technical line art on pure black background. Deep lunge position with rear knee on ground. Front hip flexor and psoas muscle of rear leg highlighted as thick glowing neon cyan (#00FFFF) line extending from lower back through hip. Arms raised overhead. Medical schematic style, minimalist, square 1:1, centered."
  },
  {
    exercise_id: "CALF_RAISE_SBL",
    prompt: "Line art on black background. Person standing on edge of step, heels lowered then raised maximally. Gastrocnemius and soleus (calf muscles) glow intensely in neon cyan (#00FFFF). Upward force arrow. Technical medical diagram style, clean, square format, centered."
  },
  {
    exercise_id: "HANGING_STRETCH_SBL",
    prompt: "Technical line art on pure black. Person hanging from bar with straight arms. Entire posterior chain from fingers through lats and spine to feet shown as continuous glowing neon cyan (#00FFFF) line under stretch. Medical schematic style, minimalist, square 1:1, centered."
  },
  {
    exercise_id: "SINGLE_LEG_HINGE_DFL",
    prompt: "Line art on black background. Person balanced on one leg, torso hinged forward parallel to ground, rear leg extended straight back. Glute and hamstring of standing leg glow in neon cyan (#00FFFF). Technical medical style, clean, square format, centered."
  },
  {
    exercise_id: "SIDE_STRETCH_LL",
    prompt: "Technical line art on pure black. Person standing with one arm reaching overhead and to the side. Entire lateral body line (side of torso, obliques, IT band) highlighted as glowing neon magenta/purple (#FF00FF). Medical diagram style, minimalist, square 1:1, centered."
  },
  {
    exercise_id: "SIDE_PLANK_LL",
    prompt: "Line art on black background. Perfect side plank position with body forming straight line. Entire lateral body from foot through obliques to shoulder glows in neon magenta/purple (#FF00FF). Technical medical style, square format, centered."
  },
  {
    exercise_id: "THORACIC_ROTATION_SL",
    prompt: "Technical line art on pure black. Person on all fours with one hand behind head, rotating upper body. Spiral pathway from hips through thoracic spine to shoulder rendered as glowing neon cyan (#00FFFF) spiral line. Medical schematic style, minimalist, square 1:1, centered."
  },
  {
    exercise_id: "WOOD_CHOP_SL",
    prompt: "Line art on black background. Person performing diagonal chopping motion from high to low across body. Spiral fascial line from shoulder to opposite hip highlighted as twisting glowing neon cyan (#00FFFF) ribbon. Technical medical style, square format, centered."
  },
  {
    exercise_id: "SUPINE_TWIST_SL",
    prompt: "Technical line art on pure black. Person lying on back with knees dropped to one side, arms in T-position. Spiral twist through spine and torso shown as glowing neon magenta/purple (#FF00FF) spiral. Medical diagram style, minimalist, square 1:1, centered."
  },
  {
    exercise_id: "FROG_STRETCH",
    prompt: "Line art on black background. Person in wide-knee frog position on ground. Inner thighs, adductors and deep hip structures glow in neon cyan (#00FFFF). Top or slight angle view. Technical medical style, clean, square format, centered."
  },
  {
    exercise_id: "BRIDGE",
    prompt: "Technical line art on pure black. Person lying on back with pelvis raised, forming bridge. Deep front line (hip flexors, abs, front of spine) highlighted as glowing neon cyan (#00FFFF) line under eccentric load. Medical schematic style, minimalist, square 1:1, centered."
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Generate images for all exercises
    for (const exerciseData of EXERCISE_IMAGE_PROMPTS) {
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
        successful: successCount,
        errors: errorCount
      },
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});