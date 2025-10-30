// Mapeamento dos cargos (roles) → siglas, ordem e regras de tag
export const RANKS = [
  {
    key: "1SGT",
    roleId: process.env.ROLE_1SGT_ID,
    label: "@👮‍♂️┋‹««┋1° Sargento SHIELD",
    sigla: "[1° SGT]",
    order: 10,
    canSetTag: true,
  },
  {
    key: "2SGT",
    roleId: process.env.ROLE_2SGT_ID,
    label: "@👮‍♂️┋««┋2° Sargento SHIELD",
    sigla: "[2° SGT]",
    order: 9,
    canSetTag: true,
  },
  {
    key: "3SGT",
    roleId: process.env.ROLE_3SGT_ID,
    label: "@👮‍♂️┋‹«┋3° Sargento SHIELD",
    sigla: "[3° SGT]",
    order: 8,
    canSetTag: true,
  },
  {
    key: "CABO",
    roleId: process.env.ROLE_CABO_ID,
    label: "@👮‍♂️┋«┋Cabo SHIELD",
    sigla: "[CB]",
    order: 7,
    canSetTag: true,
  },
  {
    key: "SOLDADO",
    roleId: process.env.ROLE_SOLDADO_ID,
    label: "@👮‍♂️┋‹┋Soldado SHIELD",
    sigla: "[SD]",
    order: 6,
    canSetTag: true, // ✅ Agora nosso bot também define [SD] quando rebaixar
  },
  {
    key: "ALUNO",
    roleId: process.env.ROLE_ALUNO_ID,
    label: "@👮‍♂️┋Aluno SHIELD",
    sigla: "[ALUNO]",
    order: 5,
    canSetTag: true, // ✅ Também define [ALUNO] quando rebaixar
  },
].filter((r) => r.roleId);

// ✅ Controlamos TODAS as tags (inclui SD e ALUNO)
export const CONTROLLED_TAGS = [
  "[1° SGT]",
  "[2° SGT]",
  "[3° SGT]",
  "[CB]",
  "[SD]",
  "[ALUNO]",
];

export function rankByRoleId(roleId) {
  return RANKS.find((r) => r.roleId === roleId);
}

export function highestRankOf(member) {
  const owned = RANKS.filter((r) => member.roles.cache.has(r.roleId));
  if (!owned.length) return null;
  return owned.sort((a, b) => b.order - a.order)[0];
}
