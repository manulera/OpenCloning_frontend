import { isRangeWithinRange } from '@teselagen/range-utils';
import { getComplementSequenceString, getAminoAcidFromSequenceTriplet, getDigestFragmentsForRestrictionEnzymes, getReverseComplementSequenceString } from '@teselagen/sequence-utils';
import { allSimplePaths } from 'graphology-simple-path';
import { openCycleAtNode } from './graph_utils';
import { downloadBlob, formatStateForJsonExport, getZipFileBlob } from '@opencloning/utils/readNwrite';
import { getGraftSequenceId } from '@opencloning/utils/network';
import { TextReader} from '@zip.js/zip.js';

export function tripletsToTranslation(triplets) {
  if (!triplets) return ''
  return triplets.map(triplet =>
    /[^ACGT]/i.test(triplet) ? ' - ' :
      getAminoAcidFromSequenceTriplet(triplet).threeLettersName.replace('Stop', '***')
  ).join('')
}

export function partDataToDisplayData(data) {
  const {
    left_codon_start: leftCodonStart,
    right_codon_start: rightCodonStart,
    left_overhang: leftOverhang,
    right_overhang: rightOverhang,
    left_inside: leftInside,
    right_inside: rightInside,
    glyph
  } = data
  const leftOverhangRc = getComplementSequenceString(leftOverhang)
  const rightOverhangRc = getComplementSequenceString(rightOverhang)
  const leftInsideRc = getComplementSequenceString(leftInside)
  const rightInsideRc = getComplementSequenceString(rightInside)
  let leftTranslationOverhang = ''
  let leftTranslationInside = ''
  if (leftCodonStart) {
    const triplets = (leftOverhang + leftInside).slice(leftCodonStart - 1).match(/.{3}/g)
    const padding = ' '.repeat(leftCodonStart - 1)
    const translationLeft = padding + tripletsToTranslation(triplets)
    leftTranslationOverhang = translationLeft.slice(0, leftOverhang.length)
    leftTranslationInside = translationLeft.slice(leftOverhang.length)
  }
  let rightTranslationOverhang = ''
  let rightTranslationInside = ''
  if (rightCodonStart) {
    const triplets = (rightInside + rightOverhang).slice(rightCodonStart - 1).match(/.{3}/g)
    const padding = ' '.repeat(rightCodonStart - 1)
    const translationRight = padding + tripletsToTranslation(triplets)
    rightTranslationInside = translationRight.slice(0, rightInside.length)
    rightTranslationOverhang = translationRight.slice(rightInside.length)
  }
  return {
    leftTranslationOverhang,
    leftTranslationInside,
    rightTranslationOverhang,
    rightTranslationInside,
    leftOverhangRc,
    rightOverhangRc,
    leftInsideRc,
    rightInsideRc,
  }
}


export function simplifyDigestFragment({cut1, cut2}) {
  return {
    left: {ovhg: cut1.overhangBps.toUpperCase(), forward: cut1.forward},
    right: {ovhg: cut2.overhangBps.toUpperCase(), forward: cut2.forward},
  };
};

export function reverseComplementSimplifiedDigestFragment({left, right, longestFeature}) {
  return {
    left: {ovhg: getReverseComplementSequenceString(right.ovhg), forward: !right.forward},
    right: {ovhg: getReverseComplementSequenceString(left.ovhg), forward: !left.forward},
    longestFeature
  };
}

export function longestFeatureInDigestFragment(digestFragment, sequenceData) {
  const {cut1, cut2} = digestFragment;
  const leftEdge = cut1.overhangSize >=0 ? cut1.topSnipPosition : cut1.bottomSnipPosition;
  const rightEdge = cut2.overhangSize >=0 ? cut2.bottomSnipPosition : cut2.topSnipPosition;
  if (!sequenceData.features || sequenceData.features.length === 0) return null;
  const featuresInside = sequenceData.features.filter(feature => isRangeWithinRange(feature, {start: leftEdge, end: rightEdge}, sequenceData.length));
  return featuresInside.reduce((longest, feature) => {
    if (!longest) return feature;
    return feature.end - feature.start > longest.end - longest.start ? feature : longest;
  }, null);
}

export function getSimplifiedDigestFragments(sequenceData, enzymes) {
  const { sequence, circular } = sequenceData;

  const digestFragments = getDigestFragmentsForRestrictionEnzymes(
    sequence,
    circular,
    enzymes,
  );

  const longestFeatures = digestFragments.map(fragment => longestFeatureInDigestFragment(fragment, sequenceData));
  const simplifiedDigestFragments = digestFragments.map(simplifyDigestFragment);
  simplifiedDigestFragments.forEach((fragment, index) => {
    fragment.longestFeature = longestFeatures[index];
  });
  const simplifiedDigestFragmentsRc = simplifiedDigestFragments.map(reverseComplementSimplifiedDigestFragment);
  return simplifiedDigestFragments.concat(simplifiedDigestFragmentsRc);
}

export function isFragmentPalindromic(fragment) {
  return (
    (fragment.left.ovhg === getReverseComplementSequenceString(fragment.left.ovhg)) &&
    (fragment.right.ovhg === getReverseComplementSequenceString(fragment.right.ovhg))
  )
}

export function assignSequenceToSyntaxPart(sequenceData, enzymes, graph) {
  // Something that is important to understand here is the meaning of forward and reverse.
  // It does not mean whether the overhang is 5' or 3', the value on the top strand is always
  // used, which is convenient for classification within the syntax.
  // Instead, forward means whether the recognition site was forward or reverse when producing that cut.
  // see the test called "shows the meaning of forward and reverse" for more details.
  const simplifiedDigestFragments = getSimplifiedDigestFragments(sequenceData, enzymes);
  const foundParts = [];
  simplifiedDigestFragments
    .filter(f => f.left.forward && !f.right.forward && graph.hasNode(f.left.ovhg) && graph.hasNode(f.right.ovhg))
    .forEach(fragment => {
      const graphForPaths = isFragmentPalindromic(fragment) ? openCycleAtNode(graph, graph.nodes()[0]) : graph;
      const paths = allSimplePaths(graphForPaths, fragment.left.ovhg, fragment.right.ovhg);
      if (paths.length > 0) {
        foundParts.push({left_overhang: fragment.left.ovhg, right_overhang: fragment.right.ovhg, longestFeature: fragment.longestFeature});
      }
    });
  return foundParts;
}

export function arrayCombinations(sets) {
  if (sets.length === 0) {
    return null;
  } else if (sets.length === 1) {
    return sets[0].map((el) => [el]);
  } else
    return sets[0].flatMap((val) =>
      arrayCombinations(sets.slice(1)).map((c) => [val].concat(c))
    );
};

export function categoryFilter(category, categories, previousCategoryId) {
  if (previousCategoryId === null) {
    return category.left_overhang === categories[0].left_overhang
  }
  const previousCategory = categories.find((category) => category.id === previousCategoryId)
  return previousCategory?.right_overhang === category.left_overhang
}

export function getFilesToExportFromAssembler({requestedAssemblies, expandedAssemblies, plasmids, currentCategories, categories, appInfo}) {
  const files2Export = [];
  const categoryNames = ['Assembly', ...currentCategories.map(categoryId => categories.find(c => c.id === categoryId).displayName)];
  const assemblyNames = expandedAssemblies.map((assembly, index) => {
    return [index + 1, ...assembly.map(part => plasmids.find(p => p.id === part).plasmid_name)];
  });
  for (const delimiter of ['\t', ',']) {
    const tableHeader = categoryNames.join(delimiter);
    const tableRows = assemblyNames.map(assemblyName => assemblyName.join(delimiter));
    const table = [tableHeader, ...tableRows].join('\n');
    const extension = delimiter === '\t' ? 'tsv' : 'csv';
    files2Export.push({
      name: `assemblies.${extension}`,
      content: table,
    });
  }

  for (let i = 0; i < requestedAssemblies.length; i++) {
    let name = `${String(i + 1).padStart(3, '0')}_${assemblyNames[i].slice(1).join('+')}`;
    if (name.length > 255) {
      name = `${String(i + 1).padStart(3, '0')}_construct`;
    }
    const requestedAssembly = requestedAssemblies[i];
    const jsonContent = formatStateForJsonExport({...requestedAssembly, appInfo});
    files2Export.push({
      name: `${name}.json`,
      content: JSON.stringify(jsonContent, null, 2),
    });
    const finalSequenceId = getGraftSequenceId(requestedAssembly)
    const finalSequence = requestedAssembly.sequences.find(s => s.id === finalSequenceId)
    files2Export.push({
      name: `${name}.gbk`,
      content: finalSequence.file_content,
    });
  }
  return files2Export;
}

export async function downloadAssemblerFilesAsZip(files) {
  const files2write = files.map(({name, content}) => ({name, reader: new TextReader(content)}));

  const blob = await getZipFileBlob(files2write);
  downloadBlob(blob, 'assemblies.zip');
}
