export function convertTextToTipTapJson(rawText: string, filename: string) {
  const lines = rawText.split(/\r?\n/);
  const nodes: any[] = [];

  let currentBulletList: any[] | null = null;
  let currentOrderedList: any[] | null = null;

  function flushLists() {
    if (currentBulletList && currentBulletList.length > 0) {
      nodes.push({
        type: 'bulletList',
        content: currentBulletList,
      });
      currentBulletList = null;
    }
    if (currentOrderedList && currentOrderedList.length > 0) {
      nodes.push({
        type: 'orderedList',
        content: currentOrderedList,
      });
      currentOrderedList = null;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // Check headings (# , ## , ### )
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushLists();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      if (text) {
        nodes.push({
          type: 'heading',
          attrs: { level },
          content: [{ type: 'text', text }],
        });
      }
      continue;
    }

    // Check bullet lists (- , * , + )
    const bulletMatch = line.match(/^[\-\*\+]\s+(.*)$/);
    if (bulletMatch) {
      if (currentOrderedList) flushLists();
      if (!currentBulletList) currentBulletList = [];

      const itemText = bulletMatch[1].trim();
      currentBulletList.push({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: itemText ? [{ type: 'text', text: itemText }] : [],
          },
        ],
      });
      continue;
    }

    // Check ordered lists (1. , 2. )
    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (currentBulletList) flushLists();
      if (!currentOrderedList) currentOrderedList = [];

      const itemText = orderedMatch[1].trim();
      currentOrderedList.push({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: itemText ? [{ type: 'text', text: itemText }] : [],
          },
        ],
      });
      continue;
    }

    // Normal paragraph or empty line
    flushLists();
    if (trimmed.length > 0) {
      nodes.push({
        type: 'paragraph',
        content: [{ type: 'text', text: trimmed }],
      });
    }
  }

  flushLists();

  if (nodes.length === 0) {
    nodes.push({
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    });
  }

  return JSON.stringify({
    type: 'doc',
    content: nodes,
  });
}
