export interface Coordinates{latitude:number;longitude:number}
export interface RouteEstimate{distanceMiles:number;durationMinutes?:number}
export async function getRouteEstimate(origin:string|Coordinates,destination:string|Coordinates):Promise<RouteEstimate>{void origin;void destination;throw new Error("Maps provider is not configured yet.")}