import {
  ExtractorPropertyRegistry,
  PropertyAttribution
} from '../../types/metrology';

export class PropertyRegistry {
  private properties: Map<string, ExtractorPropertyRegistry> = new Map();
  private attributions: Map<string, PropertyAttribution> = new Map();

  public registerExtractor(property: ExtractorPropertyRegistry): void {
    this.properties.set(property.extractorId, property);
  }

  public registerAttribution(failureType: string, attribution: PropertyAttribution): void {
    this.attributions.set(failureType, attribution);
  }

  public exportRegistry(): string {
    const data = {
      properties: Object.fromEntries(this.properties),
      attributions: Object.fromEntries(this.attributions)
    };
    return JSON.stringify(data, null, 2);
  }
}
