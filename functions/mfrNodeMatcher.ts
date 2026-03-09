import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Map body regions to relevant MFR Nodes (12-Node-System)
const REGION_TO_NODES = {
  'nacken': ['N1', 'N3'],           // Cranio-Cervical + Thoracic
  'hals_nacken': ['N1', 'N3'],      // Same as nacken
  'schulter': ['N2', 'N3'],         // Pectoral + Thoracic
  'brust': ['N2', 'N3'],            // Pectoral Anchor + Thoracic
  'ruecken': ['N3', 'N6', 'N7'],    // Thoracic + Gluteal + Lumbar
  'oberer_ruecken': ['N3'],         // Thoracic Spine
  'unterer_ruecken': ['N7'],        // Lumbar Fascia
  'rumpf': ['N2', 'N3', 'N4'],      // Pectoral + Thoracic + Lateral Rib
  'lws': ['N5', 'N7'],              // Pelvic In-Sling + Lumbar
  'huefte': ['N5', 'N6', 'N9'],     // Pelvic + Gluteal + Lateral Hip
  'oberschenkel': ['N8', 'N10'],    // Anterior + Hamstring
  'vorder_oberschenkel': ['N8'],    // Anterior Thigh
  'hinter_oberschenkel': ['N10'],   // Hamstring Root
  'knie': ['N8', 'N10', 'N11'],     // Anterior + Hamstring + Tibial
  'unterschenkel': ['N11'],         // Anterior Tibial
  'fuss': ['N11', 'N12'],           // Tibial + Plantar
  'fusssohle': ['N12'],             // Plantar Root
  'beine': ['N8', 'N9', 'N10', 'N11'] // Multiple leg nodes
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { region } = await req.json();

    if (!region) {
      return Response.json(
        { error: 'Region parameter required' },
        { status: 400 }
      );
    }

    // Get matching node IDs
    const nodeIds = REGION_TO_NODES[region.toLowerCase()] || [];
    
    if (nodeIds.length === 0) {
      return Response.json({
        nodes: [],
        message: `Keine MFR-Nodes für Region '${region}' gefunden`
      });
    }

    // Fetch actual node data
    const allNodes = await base44.asServiceRole.entities.MFRNode.list();
    const matchedNodes = allNodes.filter(node => nodeIds.includes(node.node_id));

    // Sort by order for protocol sequence
    matchedNodes.sort((a, b) => (a.order || 999) - (b.order || 999));

    return Response.json({
      region,
      nodes: matchedNodes,
      nodeCount: matchedNodes.length,
      protocol: `${matchedNodes.length} Nodes für Hardware-Release vorbereitet`,
      message: `Schmerzregion '${region}' analysiert. Starte MFR-Protokoll mit ${matchedNodes.length} Trigger-Punkten.`
    });

  } catch (error) {
    console.error('MFR Node Matcher Error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});