export type BackendApiMethod = "GET" | "POST" | "PATCH";
export type BackendContractArea = "auth" | "catalog" | "orders" | "seller";

export type BackendEntityId = string;
export type IsoDateTimeString = string;

export type BackendListResponse<T> = {
  items: T[];
  total: number;
  nextCursor?: string | null;
};

export type BackendEndpointDefinition = {
  id: string;
  area: BackendContractArea;
  method: BackendApiMethod;
  path: string;
  summary: string;
  mvpRequired: boolean;
};
