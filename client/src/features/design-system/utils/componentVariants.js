export const buildVariantGroups = (variantFn) => {
  if (!variantFn || !variantFn.variants) return [];
  const defaultVariants = variantFn.defaultVariants || {};
  return Object.entries(variantFn.variants).map(([groupName, options]) => {
    const items = Object.keys(options).map((optionKey) => ({
      props: { [groupName]: optionKey },
      label: `${groupName}: ${optionKey}`,
      isDefault: defaultVariants[groupName] === optionKey,
    }));
    return { name: groupName, items };
  });
};
