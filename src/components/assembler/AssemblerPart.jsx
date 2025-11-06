import React from 'react'
import styles from './assembly_component.module.css'

import { getAminoAcidFromSequenceTriplet, getComplementSequenceString } from '@teselagen/sequence-utils'
import { getSvgByGlyph } from './sbol_visual_glyphs'


const defaultData =
  {
    header: 'Promoter',
    body: 'promoter text',
    glyph: 'cds-stop',
    left_overhang: 'CATG',
    right_overhang: 'TATG',
    left_inside:'AAAATA',
    right_inside:'AATG',
    left_codon_start: 2,
    right_codon_start: 1,
    color: 'greenyellow',
  }


function AssemblerPart( { data = defaultData } ) {
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
    const translationLeft = padding + triplets.map(triplet => getAminoAcidFromSequenceTriplet(triplet).threeLettersName.replace('Stop', '***')).join('')
    leftTranslationOverhang = translationLeft.slice(0, leftOverhang.length)
    leftTranslationInside = translationLeft.slice(leftOverhang.length)
  }
  let rightTranslationOverhang = ''
  let rightTranslationInside = ''
  if (rightCodonStart) {
    const triplets = (rightInside + rightOverhang).slice(rightCodonStart - 1).match(/.{3}/g)
    const padding = ' '.repeat(rightCodonStart - 1)
    const translationRight = padding + triplets.map(triplet => getAminoAcidFromSequenceTriplet(triplet).threeLettersName.replace('Stop', '***')).join('')
    rightTranslationInside = translationRight.slice(0, rightInside.length)
    rightTranslationOverhang = translationRight.slice(rightInside.length)
  }

  return (

    <div className={styles.container}>
      <div className={`${styles.dna} ${styles.overhang} ${styles.left}`}>
        <div className={styles.top}>{leftTranslationOverhang}</div>
        <div className={styles.watson}>{leftOverhang}</div>
        <div className={styles.crick}>{leftOverhangRc}</div>
        <div className={styles.bottom}> </div>
      </div>
      {leftInside && (
        <div className={`${styles.dna} ${styles.insideLeft}`}>
          <div className={styles.top}>{leftTranslationInside}</div>
          <div className={styles.watson}>{leftInside}</div>
          <div className={styles.crick}>{leftInsideRc}</div>
          <div className={styles.bottom}> </div>
        </div>
      )}
      <div className={styles.boxContainer}>
        <div className={styles.box}>
          <div className={styles.imageContainer} style={{ backgroundColor: data.color || 'lightgray' }}>
            <img src={getSvgByGlyph(glyph)} alt={`${glyph}.svg`} />
          </div>
        </div>
      </div>
      {rightInside && (
        <div className={`${styles.dna} ${styles.insideRight}`}>
          <div className={styles.top}>{rightTranslationInside}</div>
          <div className={styles.watson}>{rightInside}</div>
          <div className={styles.crick}>{rightInsideRc}</div>
          <div className={styles.bottom}> </div>
        </div>
      )}
      <div className={`${styles.dna} ${styles.overhang} ${styles.right}`}>
        <div className={styles.top}>{rightTranslationOverhang}</div>
        <div className={styles.watson}>{rightOverhang}</div>
        <div className={styles.crick}>{rightOverhangRc}</div>
        <div className={styles.bottom}> </div>
      </div>
    </div>

  )
}

export default AssemblerPart
