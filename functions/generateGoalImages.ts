import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { goalId } = await req.json();

    if (!goalId) {
      return Response.json({ error: 'goalId required' }, { status: 400 });
    }

    // Load goal
    const goal = await base44.asServiceRole.entities.PerformanceGoal.get(goalId);

    if (!goal) {
      return Response.json({ error: 'Goal not found' }, { status: 404 });
    }

    const updates = {};
    
    // Generate mobilisation image if missing
    if (goal.mobilisation_instruction && !goal.image_url) {
      const mobilisationPrompt = `Anatomical drawing of ${goal.mobilisation_name || goal.name}. Side profile view showing proper form. Medical illustration style. Minimalist, clean background. No text. No words. No labels. No annotations.`;
      
      const mobilisationResult = await base44.asServiceRole.integrations.Core.GenerateImage({
        prompt: mobilisationPrompt
      });
      
      if (mobilisationResult.url) {
        updates.image_url = mobilisationResult.url;
      }
    }

    // Generate stretch image if missing
    if (goal.stretch_instruction && !goal.gif_url) {
      const stretchPrompt = `Anatomical drawing of ${goal.stretch_name || goal.name}. Front or side view showing stretch position. Medical illustration style. Minimalist, clean background. No text. No words. No labels. No annotations.`;
      
      const stretchResult = await base44.asServiceRole.integrations.Core.GenerateImage({
        prompt: stretchPrompt
      });
      
      if (stretchResult.url) {
        updates.gif_url = stretchResult.url;
      }
    }

    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.PerformanceGoal.update(goalId, updates);
      return Response.json({ 
        success: true, 
        generated: Object.keys(updates),
        goal: { ...goal, ...updates }
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Goal already has images',
      goal 
    });

  } catch (error) {
    console.error('Error generating images:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});