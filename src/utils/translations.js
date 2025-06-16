// Tag and category translations for French content
// Preferred capitalization for tags
export const tagCapitalization = {
  'antarctica': 'Antarctica',
  'homo sapiens': 'Homo sapiens',
  'luberon': 'Luberon',
  'paleolithic': 'Paleolithic',
}

export const tagTranslations = {
  'animals': 'animaux',
  'antarctica': 'Antarctique',
  'archaeology': 'archéologie',
  'art': 'art',
  'biodiversity': 'biodiversité',
  'bird conservation': 'préservation des oiseaux',
  'birds': 'oiseaux',
  'cave': 'grotte',
  'climate': 'climat',
  'climate change': 'changement climatique',
  'duck': 'canard',
  'equitherapy': 'équithérapie',
  'flowers': 'fleurs',
  'global warming': 'réchauffement climatique',
  'hawks': 'faucons',
  'homo sapiens': 'Homo sapiens',
  'horses': 'chevaux',
  'hunting': 'chasse',
  'islands': 'îles',
  'luberon': 'Luberon',
  'mental health': 'santé mentale',
  'moss': 'mousses',
  'natural heritage': 'patrimoine naturel',
  'nature': 'nature',
  'ornithotherapy': 'ornithothérapie',
  'paleoacoustics': 'paléo-acoustique',
  'penguins': 'manchots',
  'plants': 'plantes',
  'positive news': 'nouvelles positives',
  'silence': 'silence',
  'sustainability': 'durabilité',
  'tulips': 'tulipes',
  'paleolithic': 'Paléolithique',
  'prehistory': 'préhistoire',
  'unusual': 'insolite',
  'well-being': 'bien-être',
  'wildlife': 'faune',
}

export const categoryTranslations = {
  'conservation': 'conservation',
  'ecology': 'écologie',
  'environment': 'environnement',
  'handicap': 'handicap',
  'nature': 'nature',
  'science': 'science',
  'wildlife': 'faune',
}

export const translateTag = (tag) => {
  if (!tag) return tag
  const lowercaseTag = tag.toLowerCase()
  // First get the translation
  const translation = tagTranslations[lowercaseTag]
  if (!translation) {
    // If no translation found, return the capitalized version if it exists, otherwise the original tag
    return tagCapitalization[lowercaseTag] || tag
  }
  return translation
}

export const translateCategory = (category) => {
  if (!category) return category
  const lowercaseCategory = category.toLowerCase()
  return categoryTranslations[lowercaseCategory] || category
}
