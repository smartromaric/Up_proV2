import type {
  DocumentExtractionResult,
  MergedExtraction,
} from "./documentExtraction.types";
import { consolidateExtractionWarnings } from "./localizeExtractionWarning";

export function mergeExtractionResults(
  results: DocumentExtractionResult[]
): MergedExtraction {
  const warnings: string[] = [];
  const driver: MergedExtraction["driver"] = {};
  const vehicle: MergedExtraction["vehicle"] = {};

  for (const result of results) {
    if (result.error) {
      warnings.push(`${result.documentType}: ${result.error}`);
      continue;
    }
    if (result.warnings?.length) warnings.push(...result.warnings);

    if (result.driver?.first_name && !driver.first_name) {
      driver.first_name = result.driver.first_name;
      driver.confidence = result.driver.confidence;
    }
    if (result.driver?.last_name && !driver.last_name) {
      driver.last_name = result.driver.last_name;
    }
    if (result.driver?.document_number && !driver.document_number) {
      driver.document_number = result.driver.document_number;
    }

    if (result.vehicle?.plate && !vehicle.plate) vehicle.plate = result.vehicle.plate;
    if (result.vehicle?.brand && !vehicle.brand) vehicle.brand = result.vehicle.brand;
    if (result.vehicle?.model && !vehicle.model) vehicle.model = result.vehicle.model;
    if (result.vehicle?.year && !vehicle.year) vehicle.year = result.vehicle.year;
    if (result.vehicle?.color && !vehicle.color) vehicle.color = result.vehicle.color;
    if (result.vehicle?.confidence != null && vehicle.confidence == null) {
      vehicle.confidence = result.vehicle.confidence;
    }
  }

  return {
    driver,
    vehicle,
    warnings: consolidateExtractionWarnings(warnings),
    byDocument: results,
  };
}
