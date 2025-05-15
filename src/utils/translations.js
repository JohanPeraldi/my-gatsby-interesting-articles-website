// Tag and category translations for French content
// Preferred capitalization for tags
export const tagCapitalization = {
  'paleolithic': 'Paleolithic',
  'homo sapiens': 'Homo sapiens'
}

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
  'equitherapy': 'équithérapie',
  'paleoacoustics': 'paléo-acoustique',
  'archaeology': 'archéologie',
  'prehistory': 'préhistoire',
  'cave': 'grotte',
  'homo sapiens': 'Homo sapiens',
  'art': 'art',
  'paleolithic': 'Paléolithique'
}

export const categoryTranslations = {
  'nature': 'nature',
  'environment': 'environnement',
  'wildlife': 'faune',
  'conservation': 'conservation',
  'ecology': 'écologie',
  'handicap': 'handicap',
  'science': 'science'
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
