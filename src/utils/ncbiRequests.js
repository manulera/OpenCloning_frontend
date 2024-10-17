import axios from 'axios';
import { escapeStringRegexp } from './other';

export async function querySpecies(userInput) {
  // Get ids from search
  const query = userInput.toLowerCase();
  // Max number of ids that will be received
  const retMax = 10000;
  let retStart = 0;
  const ids = [];
  while (retStart >= 0) {
    const url1 = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=taxonomy&term=*${query}*[WORD]+species[rank]&retmax=${retMax}&retmode=json&retstart=${retStart}`;
    const resp1 = await axios.get(url1);
    resp1.data.esearchresult.idlist.forEach((e) => ids.push(e));
    if (Number(resp1.data.esearchresult.count) > ids.length) {
      retStart += retMax;
    } else {
      retStart = -1;
    }
    if (retStart > 50000) {
      throw Error('Too many results, narrow your search');
    }
  }

  const maxRequestIds = 400;
  // Make requests with maxRequestIds ids
  const taxons = [];
  for (let i = 0; i < ids.length; i += maxRequestIds) {
    const requestedIds = ids.slice(i, i + maxRequestIds).join(',');
    const url2 = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=taxonomy&id=${requestedIds}&retmode=json`;
    const resp2Data = await axios.get(url2);
    resp2Data.data.result.uids.forEach((e) => taxons.push(resp2Data.data.result[e]));
    // NCBI is very sensitive to the number of requests, so we need to wait a bit
    if (i + maxRequestIds < ids.length) { await setTimeout(() => {}, 2000); }
  }

  return taxons.filter((taxon) => taxon.species !== ''
     && !taxon.species.includes(' ')
     && taxon.rank === 'species' && taxon.scientificname.includes(query));
}

export async function taxonSuggest(userInput) {
  const url = `https://api.ncbi.nlm.nih.gov/datasets/v2alpha/taxonomy/taxon_suggest/${userInput}`;
  const params = {
    taxon_resource_filter: 'TAXON_RESOURCE_FILTER_GENOME',
    tax_rank_filter: 'higher_taxon',
  };
  const resp = await axios.get(url, { params });
  const taxons = resp.data.sci_name_and_ids;

  // This might change if the API endpoint changes
  return taxons === undefined ? [] : taxons.filter((e) => e.rank === 'SPECIES');
}

export async function getReferenceAssemblyId(taxonId) {
  const url = `https://api.ncbi.nlm.nih.gov/datasets/v2alpha/genome/taxon/${taxonId}/dataset_report?filters.reference_only=true`;
  const resp = await axios.get(url);
  const { reports } = resp.data;
  return reports === undefined ? null : resp.data.reports[0].accession;
}

export async function geneSuggest(assemblyId, userInput) {
  const url = `https://api.ncbi.nlm.nih.gov/datasets/v2alpha/genome/accession/${assemblyId}/annotation_report?search_text=${userInput}`;
  const resp = await axios.get(url);
  // TODO: add support for api key
  // const resp = await axios.get(url, { params: {
  //   api_key: 'blah',
  // } });
  const { reports } = resp.data;
  return reports === undefined ? [] : reports;
}

export async function getInfoFromAssemblyId(assemblyId) {
  const url = `https://api.ncbi.nlm.nih.gov/datasets/v2alpha/genome/accession/${assemblyId}/dataset_report?filters.assembly_version=all_assemblies`;
  const resp = await axios.get(url, { validateStatus: false });

  if (resp.status === 404 || resp.data.reports === undefined) {
    return null;
  }
  const { reports } = resp.data;
  if (reports === undefined) {
    return null;
  }

  const species = reports[0].organism;
  const newerAssembly = reports[0].assembly_info.assembly_status !== 'current' ? reports[0].current_accession : null;

  // const url2 = `https://api.ncbi.nlm.nih.gov/datasets/v2alpha/genome/accession/${assemblyId}/annotation_report/download_summary`;
  // try {
  //   const resp2 = await axios.get(url2);
  //   const hasAnnotation = resp2.data.record_count !== undefined;
  //   return { species, hasAnnotation, newerAssembly };
  // } catch (error) {
  //   return { species, hasAnnotation: false, newerAssembly };
  // }
  return { species, hasAnnotation: reports[0].annotation_info !== undefined, newerAssembly };

  // I used to check like this, but no longer works (see https://github.com/ncbi/datasets/issues/380)
  // const annotationInfo = reports[0].annotation_info || null;
  // return reports === undefined ? null : { species, annotationInfo };
}

export async function getInfoFromSequenceAccession(sequenceAccession) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?id=${sequenceAccession}&db=nuccore&retmode=json`;
  // For example: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?id=CP046095.1&db=nuccore&retmode=json

  const resp = await axios.get(url);
  // I don't think this ever happens, but just in case
  if (resp.status === 404 || resp.data.result.uids.length === 0) {
    return null;
  }

  const { taxid: taxId, accessionversion: sequenceAccessionStandard } = resp.data.result[resp.data.result.uids[0]];

  if (!taxId) {
    return { species: null, sequenceAccessionStandard };
  }

  const url2 = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?id=${taxId}&db=taxonomy&retmode=json`;
  const resp2 = await axios.get(url2);
  const { scientificname: organismName } = resp2.data.result[resp2.data.result.uids[0]];
  return { species: { tax_id: taxId, organism_name: organismName }, sequenceAccessionStandard };
}

export async function getSequenceAccessionsFromAssemblyAccession(assemblyAccession) {
  const url = `https://api.ncbi.nlm.nih.gov/datasets/v2alpha/genome/accession/${assemblyAccession}/sequence_reports`;
  // For example: https://api.ncbi.nlm.nih.gov/datasets/v2alpha/genome/accession/GCF_000005845.2/sequence_reports
  try {
    const resp = await axios.get(url);
    return resp.data.reports;
  } catch (error) {
    return [];
  }
}
