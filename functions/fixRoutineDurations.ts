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
                
                await base44.asServiceRole.entities.Routine.update(routine.id, {
                    total_duration_seconds: actualTotalSeconds,
                    total_duration: actualTotalMinutes
                });
                
                updates.push({
                    routine_name: routine.routine_name,
                    old_minutes: routine.total_duration,
                    new_minutes: actualTotalMinutes,
                    old_seconds: routine.total_duration_seconds,
                    new_seconds: actualTotalSeconds
                });
            }
        }

        return Response.json({ success: true, updates });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
});