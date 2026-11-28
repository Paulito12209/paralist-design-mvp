/*
 * Demo-Stapel für „?demo=1“ in der „OG Version“: drei Karteistapel, deren Zähler
 * wie im Screenshot der iOS-App aussehen (Statistik-Begriffe 2 Karten / 1 offen,
 * Französisch 62 / 18 offen, Spanisch 50 / 29 neu / 11 offen). Kein Zugriff auf die Seite.
 * Pfad: src/data/demo-decks.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * demoDeckPlans -> je Stapel: Name, Kartenzahl, wie viele neu (nie abgefragt) und wie viele offen (zuletzt falsch)
 */

const demoDeckPlans = [
  { title: "Statistik-Begriffe", total: 2, fresh: 0, wrong: 1, real: [["Was ist der Median?", "Der Wert in der Mitte einer sortierten Reihe."], ["Was misst die Standardabweichung?", "Die mittlere Streuung der Werte um den Mittelwert."]] },
  { title: "Französisch", total: 62, fresh: 0, wrong: 18, front: "Mot", back: "Wort" },
  { title: "Spanisch", total: 50, fresh: 29, wrong: 11, front: "Palabra", back: "Wort" },
];

/* Karten eines Plans: zuerst die neuen, dann die falschen, der Rest richtig beantwortet. */
function demoCards(plan, now) {
  return Array.from({ length: plan.total }, (_, index) => {
    const [front, back] = plan.real?.[index] || [`${plan.front} ${index + 1}`, `${plan.back} ${index + 1}`];
    const isFresh = index < plan.fresh;
    const isWrong = !isFresh && index < plan.fresh + plan.wrong;
    return { id: index + 1, front, back, tags: [], reviewed: isFresh ? null : now - index * 60000, correct: isFresh ? null : !isWrong };
  });
}

/** Die Stapel in der Form von src/data/decks.js (Speicherschlüssel `paralist-decks`). */
export function buildDemoDecks(now = Date.now()) {
  return demoDeckPlans.map((plan, index) => ({ id: index + 1, title: plan.title, created: now - (demoDeckPlans.length - index) * 86400000, cards: demoCards(plan, now) }));
}
