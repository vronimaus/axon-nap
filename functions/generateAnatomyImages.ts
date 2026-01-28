import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate back view
    const backImage = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: "Professional medical-grade posterior back view of human body anatomy, full body standing pose, dark charcoal black background (#0f172a), anatomically accurate muscle and skeletal structure visible, neon cyan (#06b6d4) and electric violet (#8b5cf6) glowing lines tracing the spine, trapezius, latissimus dorsi, erector spinae, hamstrings, calves - showing myofascial chains, clean minimalist clinical illustration style, symmetrical, arms relaxed at sides, legs together, no face detail, high contrast, photorealistic medical illustration, 8k quality"
    });

    // Generate front view
    const frontImage = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: "Professional medical-grade anterior front view of human body anatomy, full body standing pose, dark charcoal black background (#0f172a), anatomically accurate muscle and skeletal structure visible, neon cyan (#06b6d4) and electric violet (#8b5cf6) glowing lines tracing the sternum, rectus abdominis, hip flexors, quadriceps, tibialis anterior - showing myofascial chains, clean minimalist clinical illustration style, symmetrical, arms relaxed at sides, legs together, neutral facial expression, high contrast, photorealistic medical illustration, 8k quality"
    });

    return Response.json({
      success: true,
      images: {
        back: backImage.url,
        front: frontImage.url
      }
    });

  } catch (error) {
    console.error('Error generating anatomy images:', error);
    return Response.json({ 
      error: error.message || 'Failed to generate images' 
    }, { status: 500 });
  }
});