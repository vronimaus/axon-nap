import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { imageUrl, exerciseName } = await req.json();

    if (!imageUrl) {
      return Response.json({ error: 'imageUrl required' }, { status: 400 });
    }

    // Fetch original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image');
    }

    const imageBlob = await imageResponse.blob();
    
    // Use Gemini to generate an optimized version
    // Create a mobile-friendly, optimized version with clear instructions
    const optimizedImage = await base44.integrations.Core.GenerateImage({
      prompt: `Create a clean, professional fitness exercise demonstration image for "${exerciseName}". 
      Mobile-optimized, portrait orientation (800x1200px), high contrast, clear visibility.
      Professional photography style, neutral background, proper form demonstration.
      Focus on clarity and detail for mobile screens.`,
      existing_image_urls: [imageUrl]
    });

    return Response.json({
      success: true,
      originalUrl: imageUrl,
      optimizedUrl: optimizedImage.url
    });

  } catch (error) {
    console.error('Optimization error:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});