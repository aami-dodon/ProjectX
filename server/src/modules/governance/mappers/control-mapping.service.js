const summarizeControlCoverage = (records = []) => {
  if (!Array.isArray(records) || records.length === 0) {
    return {
      totals: {
        controls: 0,
        mandatory: 0,
        recommended: 0,
        optional: 0,
      },
      distribution: [],
    };
  }

  const totals = {
    controls: 0,
    mandatory: 0,
    recommended: 0,
    optional: 0,
  };

  const perControl = new Map();

  records.forEach((record) => {
    const controlId = record.controlId;
    if (!controlId) {
      return;
    }

    if (!perControl.has(controlId)) {
      perControl.set(controlId, {
        controlId,
        links: 0,
        enforcement: {
          OPTIONAL: 0,
          RECOMMENDED: 0,
          MANDATORY: 0,
        },
        severities: {
          INFO: 0,
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          CRITICAL: 0,
        },
      });
    }

    const entry = perControl.get(controlId);
    entry.links += 1;

    const enforcement = record.enforcementLevel ?? 'OPTIONAL';
    if (entry.enforcement[enforcement] !== undefined) {
      entry.enforcement[enforcement] += 1;
      const totalKey = enforcement.toLowerCase();
      if (totals[totalKey] !== undefined) {
        totals[totalKey] += 1;
      }
    }

    const severity = record.check?.severityDefault;
    if (severity && entry.severities[severity] !== undefined) {
      entry.severities[severity] += 1;
    }
  });

  totals.controls = perControl.size;
  totals.mandatory = Array.from(perControl.values()).reduce(
    (sum, control) => sum + (control.enforcement.MANDATORY > 0 ? 1 : 0),
    0,
  );
  totals.recommended = Array.from(perControl.values()).reduce(
    (sum, control) => sum + (control.enforcement.RECOMMENDED > 0 ? 1 : 0),
    0,
  );
  totals.optional = Array.from(perControl.values()).reduce(
    (sum, control) => sum + (control.enforcement.OPTIONAL > 0 ? 1 : 0),
    0,
  );

  return {
    totals,
    distribution: Array.from(perControl.values()).map((entry) => ({
      controlId: entry.controlId,
      links: entry.links,
      enforcement: entry.enforcement,
      severities: entry.severities,
    })),
  };
};

module.exports = {
  summarizeControlCoverage,
};
