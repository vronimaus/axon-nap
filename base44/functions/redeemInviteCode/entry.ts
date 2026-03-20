import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Nicht eingeloggt' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Kein Code angegeben' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Find the invite code (service role – InviteCodes are admin-only readable)
    const codes = await base44.asServiceRole.entities.InviteCode.filter({ code: normalizedCode });

    if (codes.length === 0) {
      return Response.json({ error: 'Ungültiger Code' }, { status: 404 });
    }

    const inviteCode = codes[0];

    if (!inviteCode.is_active) {
      return Response.json({ error: 'Dieser Code ist nicht mehr aktiv' }, { status: 400 });
    }

    const maxUses = inviteCode.max_uses || 0;
    const usedCount = inviteCode.used_count || 0;
    const usedByEmails = inviteCode.used_by_emails || [];

    // Check if already used by this user
    if (usedByEmails.includes(user.email)) {
      return Response.json({ error: 'Du hast diesen Code bereits eingelöst' }, { status: 400 });
    }

    // Check usage limit
    if (maxUses > 0 && usedCount >= maxUses) {
      return Response.json({ error: 'Dieser Code ist bereits aufgebraucht' }, { status: 400 });
    }

    // Grant access: set has_paid = true on the user
    await base44.auth.updateMe({ has_paid: true });

    // Update invite code usage
    await base44.asServiceRole.entities.InviteCode.update(inviteCode.id, {
      used_count: usedCount + 1,
      used_by_emails: [...usedByEmails, user.email],
      is_active: maxUses > 0 && (usedCount + 1) >= maxUses ? false : inviteCode.is_active
    });

    console.log(`[redeemInviteCode] User ${user.email} redeemed code "${normalizedCode}" → has_paid = true`);

    return Response.json({ success: true, message: 'Zugang freigeschaltet!' });

  } catch (error) {
    console.error('[redeemInviteCode] Error:', error.message);
    return Response.json({ error: error.message || 'Unbekannter Fehler' }, { status: 500 });
  }
});