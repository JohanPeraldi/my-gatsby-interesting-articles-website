// Tag and category translations for French content
export const tagTranslations = {
  'positive news': 'nouvelles positives',
  'sustainability': 'durabilité',
  'climate': 'climat',
  'biodiversity': 'biodiversité',
  'global warming': 'réchauffement climatique',
  'animals': 'animaux',
  'horses': 'chevaux',
  'plants': 'plantes',
  'moss': 'mousses',
  'flowers': 'fleurs',
  'tulips': 'tulipes',
  'bird conservation': 'préservation des oiseaux',
  'ornithotherapy': 'ornithothérapie',
  'mental health': 'santé mentale',
  'equitherapy': 'équithérapie'
}

export const categoryTranslations = {
  'nature': 'nature',
  'environment': 'environnement',
  'wildlife': 'faune',
  'conservation': 'conservation',
  'ecology': 'écologie',
  'handicap': 'handicap'
}

export const translateTag = (tag) => {
  if (!tag) return tag
  const lowercaseTag = tag.toLowerCase()
  return tagTranslations[lowercaseTag] || tag
}

export const translateCategory = (category) => {
  if (!category) return category
  const lowercaseCategory = category.toLowerCase()
  return categoryTranslations[lowercaseCategory] || category
}
