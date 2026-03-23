export type BehaviorCategory =
  | "SLEEP"
  | "ENERGY"
  | "MANIC"
  | "DEPRESSIVE"
  | "MIXED_CYCLING";

export interface BehaviorItem {
  key: string;
  category: BehaviorCategory;
  label: string;
  description: string;
}

export const BEHAVIOR_ITEMS: BehaviorItem[] = [
  // SLEEP
  { key: "very-little-sleep", category: "SLEEP", label: "Very little sleep", description: "Got much less sleep than normal" },
  { key: "slept-too-much", category: "SLEEP", label: "Slept too much", description: "Way more sleep than normal or couldn't get out of bed" },
  { key: "irregular-sleep", category: "SLEEP", label: "Irregular sleep pattern", description: "Up and down, couldn't fall asleep, woke repeatedly" },

  // ENERGY
  { key: "no-energy", category: "ENERGY", label: "No energy today", description: "Dragging, sluggish, couldn't get going" },
  { key: "high-energy", category: "ENERGY", label: "Unusually high energy", description: "Wired, amped up, more energy than usual" },
  { key: "selective-energy", category: "ENERGY", label: "Selective energy", description: "Too tired for obligations but fine for preferred activities" },
  { key: "psychosomatic", category: "ENERGY", label: "Psychosomatic complaints", description: "Headache, stomachache, body aches with no clear medical cause" },

  // MANIC
  { key: "pressured-speech", category: "MANIC", label: "Pressured rapid speech", description: "Talking fast, loud, or impossible to interrupt" },
  { key: "racing-thoughts", category: "MANIC", label: "Racing jumping thoughts", description: "Bouncing between topics, can't stay on one thing" },
  { key: "euphoria", category: "MANIC", label: "Euphoria without cause", description: "Unusually happy, giddy, or wired for no clear reason" },
  { key: "grandiose", category: "MANIC", label: "Grandiose or invincible", description: "Acting like they're the best, special, or can't be touched" },
  { key: "nonstop-activity", category: "MANIC", label: "Nonstop goal activity", description: "Starting tons of projects, plans, tasks all at once" },
  { key: "restless-agitation", category: "MANIC", label: "Physical restless agitation", description: "Pacing, can't sit still, excess physical energy" },
  { key: "disproportionate-rage", category: "MANIC", label: "Disproportionate rage", description: "Explosive anger way beyond what the situation warranted" },
  { key: "reckless-choices", category: "MANIC", label: "Reckless dangerous choices", description: "Risky behavior they'd normally never do" },
  { key: "bizarre-behavior", category: "MANIC", label: "Bizarre out-of-character", description: "Dressing, acting, or talking in ways that aren't them" },
  { key: "denies-anything-wrong", category: "MANIC", label: "Denies anything wrong", description: "Insists they're fine when they clearly aren't" },

  // DEPRESSIVE
  { key: "sad-empty-hopeless", category: "DEPRESSIVE", label: "Sad empty hopeless", description: "Down, flat, or hopeless most of the day" },
  { key: "lost-interest", category: "DEPRESSIVE", label: "Lost all interest", description: "No motivation for things they usually love" },
  { key: "eating-more", category: "DEPRESSIVE", label: "Eating way more", description: "Noticeably increased appetite or food intake" },
  { key: "eating-less", category: "DEPRESSIVE", label: "Eating way less", description: "Skipping meals or barely eating" },
  { key: "withdrawn", category: "DEPRESSIVE", label: "Withdrawn from people", description: "Avoiding friends, family, or any social contact" },
  { key: "worthless-guilt", category: "DEPRESSIVE", label: "Worthless excessive guilt", description: "Saying they're a burden, a failure, not enough" },
  { key: "cant-focus", category: "DEPRESSIVE", label: "Can't focus decide", description: "Unable to concentrate or make simple decisions" },
  { key: "mentioned-death", category: "DEPRESSIVE", label: "Mentioned death dying", description: "Any reference to death, not wanting to be here, or self-harm" },

  // MIXED / CYCLING
  { key: "mood-swings", category: "MIXED_CYCLING", label: "Mood energy swings", description: "Shifted between high and low mood or energy within the day" },
  { key: "agitated-depressed", category: "MIXED_CYCLING", label: "Agitated but depressed", description: "Sad or hopeless but also restless, wired, can't settle" },
  { key: "unprovoked-temper", category: "MIXED_CYCLING", label: "Unprovoked temper explosion", description: "Came out of nowhere, no proportional trigger" },
  { key: "unusual-anxiety", category: "MIXED_CYCLING", label: "Unusual anxiety panic", description: "Anxious, panicky, or clingy beyond what's typical for them" },
  { key: "aggressive-destructive", category: "MIXED_CYCLING", label: "Aggressive or destructive", description: "Broke things, hit, or got physically aggressive" },
];

export function getItemsByCategory(category: BehaviorCategory): BehaviorItem[] {
  return BEHAVIOR_ITEMS.filter((item) => item.category === category);
}
