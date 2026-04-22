// Test file to verify the Unit Details implementation works correctly
import { transformUnitToViewModel } from './unit-selectors';
import { mockRawUnit, mockRawUnitMinimal } from './test-data';

// Test the transformation with complete data
const completeUnit = transformUnitToViewModel(mockRawUnit);
console.log('Complete unit transformed:', {
  id: completeUnit.id,
  title: completeUnit.title,
  projectName: completeUnit.projectName,
  hasImages: completeUnit.heroImages.length > 0,
  hasPricing: !!completeUnit.totalPrice,
  hasQuickFacts: completeUnit.quickFacts.length > 0,
  hasSpecs: completeUnit.specs.length > 0,
});

// Test with minimal data
const minimalUnit = transformUnitToViewModel(mockRawUnitMinimal);
console.log('Minimal unit transformed:', {
  id: minimalUnit.id,
  title: minimalUnit.title,
  projectName: minimalUnit.projectName,
  hasImages: minimalUnit.heroImages.length > 0,
  hasPricing: !!minimalUnit.totalPrice,
  hasQuickFacts: minimalUnit.quickFacts.length > 0,
  hasSpecs: minimalUnit.specs.length > 0,
});

// Export for manual testing
export { completeUnit, minimalUnit };
