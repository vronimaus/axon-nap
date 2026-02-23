import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const routines = await base44.asServiceRole.entities.Routine.list();
        const updates = [];

        for (const routine of routines) {
            if (routine.sequence && Array.isArray(routine.sequence)) {
                let actualTotalSeconds = 0;
                for (const seq of routine.sequence) {
                    actualTotalSeconds += (seq.duration_seconds || 0);
                }
                const actualTotalMinutes = Math.ceil(actualTotalSeconds / 60);
                
                let desc = routine.description || "";
                
                // Replace e.g. "15 Minuten." with "8 Minuten."
                desc = desc.replace(/^\d+\s*Minuten\./i, `${actualTotalMinutes} Minuten.`);
                
                await base44.asServiceRole.entities.Routine.update(routine.id, {
                    description: desc
                });
                
                updates.push({
                    routine_name: routine.routine_name,
                    old_desc: routine.description,
                    new_desc: desc
                });
            }
        }

        return Response.json({ success: true, updates });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
});