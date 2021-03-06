import {
  ApplyTransformation,
  GetClassSuggestions,
  GetPropertySuggestions,
  GetTransformationScript,
  ColumnRefinements,
} from "../Definitions";
import getRattTransformationScript from "../utils/ratt/getTransformation";
import getCowTransformationScript from "./cowScript";
import applyTransformation from "./rattScript";
import getRmlTransformationScript from "./rmlScript";
import {
  getClassSuggestions as getElasticClassSuggestions,
  getPropertySuggestions as getElasticPropertySuggestions,
} from "./elasticSearch";
import {
  getClassSuggestions as getSparqlClassSuggestions,
  getPropertySuggestions as getSparqlPropertySuggestions,
} from "./sparqlSearch";
import config from "./wizardConfigDefaults";
import defaultImage from "./assets/LDWizard.png";
import defaultFavIcon from "./assets/favIcon.svg";
import { PrefixesArray } from "@triply/utils/lib/prefixUtils";
import { AccessLevel as DatasetAccessLevel } from "@triply/utils/lib/Models";
const defaultEndpoint = "https://api.data.netwerkdigitaalerfgoed.nl/datasets/ld-wizard/sdo/services/sparql/sparql";

export type TriplyDbReference = {
  label: string;
  link: string;
};

export interface WizardAppConfig {
  /**
   * Branding
   */
  primaryColor: string;
  secondaryColor: string;
  brandLogo: string;
  appName: string;
  favIcon: string;
  documentationLink: string;
  repositoryLink: string;
  dataplatformLink: string;
  homepageMarkdown: string | undefined;
  triplyDbInstances: TriplyDbReference[];
  /**
   * App functions
   */
  defaultBaseIri: string;
  getPrefixes: () => Promise<PrefixesArray>;
  publishOrder: PublishElement[];
  getClassSuggestions: GetClassSuggestions;
  getPropertySuggestions: GetPropertySuggestions;
  getTransformationScript: GetTransformationScript;
  applyTransformation: ApplyTransformation;
  refinementOptions: ColumnRefinements;
  exampleCsv: string | undefined;

  newDatasetAccessLevel: DatasetAccessLevel;
}
export type PublishElement = "download" | "triplyDB";

export const wizardAppConfig: WizardAppConfig = {
  /**
   * Branding
   */
  appName: config.appName || "LD-Wizard",
  dataplatformLink: config.dataplatformLink || "https://data.netwerkdigitaalerfgoed.nl/",
  documentationLink: config.documentationLink || "https://github.com/netwerk-digitaal-erfgoed/LDWizard",
  repositoryLink: config.repositoryLink || "https://github.com/netwerk-digitaal-erfgoed/LDWizard-Core",
  primaryColor: config.primaryColor || "#6d1e70",
  secondaryColor: config.secondaryColor || "#a90362",
  brandLogo: config.icon || defaultImage,
  favIcon: config.favIcon || defaultFavIcon,
  homepageMarkdown: config.homepageMarkdown || undefined,
  /** App
   *
   */
  publishOrder: ["download", "triplyDB"],
  triplyDbInstances: config.triplyDbInstances || [],
  defaultBaseIri: config.defaultBaseIri || "https://data.netwerkdigitaalerfgoed.nl/",
  exampleCsv: config.exampleCSV || undefined,

  /**
   * Search and IRI Processing
   */
  getClassSuggestions: (term) =>
    config.classConfig?.method === "elastic"
      ? getElasticClassSuggestions(term, config.classConfig.endpoint)
      : getSparqlClassSuggestions(term, config.classConfig?.endpoint || defaultEndpoint),
  getPropertySuggestions: (term) =>
    config.predicateConfig?.method === "elastic"
      ? getElasticPropertySuggestions(term, config.predicateConfig.endpoint)
      : getSparqlPropertySuggestions(term, config.predicateConfig?.endpoint || defaultEndpoint),
  getPrefixes:
    config.getAllowedPrefixes ||
    (async () => [
      {
        iri: "https://schema.org/",
        prefixLabel: "schema",
      },
    ]),
  /**
   * Transformation
   */
  applyTransformation: applyTransformation,
  getTransformationScript: (config, type) => {
    switch (type) {
      case "cow":
        return getCowTransformationScript(config);
      case "ratt":
        return getRattTransformationScript(config);
      case "rml":
        return getRmlTransformationScript(config);
      default:
        throw new Error(`Script ${type} has not been implemented yet`);
    }
  },
  /**
   * RefinementOptions
   */
  refinementOptions: config.columnRefinements || [],

  newDatasetAccessLevel: config.newDatasetAccessLevel || "private",
};

export default wizardAppConfig;
