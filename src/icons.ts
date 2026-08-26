// import.meta.env.BASE_URL (not a hardcoded '/leaf-garden/') so these
// resolve correctly under any deploy base — production, or the staging
// build published under /leaf-garden/staging/.
const iconUrl = (file: string) => `${import.meta.env.BASE_URL}icons/${file}`;

export const ICONS = {
  careEntry: iconUrl('upgrade.png'),
  delete: iconUrl('delete.png'),
  casesEntry: iconUrl('case-leaf.png'),
  caseCommon: iconUrl('case-common.png'),
  caseExclusive: iconUrl('case-exclusive.png'),
  water: iconUrl('water.png'),
  fertilize: iconUrl('fertilizer.png'),
  boost: iconUrl('levelup.png'),
  promo: iconUrl('promo.png'),
  invite: iconUrl('referral.png'),
  kochBrat: iconUrl('koch-brat.png'),
};
