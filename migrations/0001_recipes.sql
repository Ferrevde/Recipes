CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('breakfast', 'lunch', 'dinner', 'dessert', 'snack')),
  prep_minutes INTEGER NOT NULL CHECK (prep_minutes >= 0),
  cook_minutes INTEGER NOT NULL CHECK (cook_minutes >= 0),
  servings INTEGER NOT NULL CHECK (servings >= 1),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Advanced')),
  summary TEXT NOT NULL DEFAULT '',
  ingredients_json TEXT NOT NULL,
  steps_json TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS recipes_category_idx ON recipes(category);
