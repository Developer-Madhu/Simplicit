import { BlueprintAPI, BlueprintService, BlueprintField, BlueprintValidation } from "@/features/architecture/types";

export interface ApiSurfaceDefinition extends BlueprintAPI {
  resource: string;
  kind: "crud" | "relationship" | "action";
  params: string[];
  requestBody?: DtoDefinition;
  responseBody: DtoDefinition;
}

export interface ActionEndpoint extends ApiSurfaceDefinition {
  kind: "action";
  capabilityId: string;
}

export interface DtoDefinition {
  name: string;
  fields: DtoField[];
}

export interface DtoField {
  name: string;
  type: string;
  isNullable: boolean;
  isRequired: boolean;
  validation?: BlueprintValidation;
}

export interface ServiceDefinition extends BlueprintService {
  methods: ServiceMethodDefinition[];
}

export interface ServiceMethodDefinition {
  name: string;
  params: ServiceMethodParam[];
  returnType: string;
  isAsync: boolean;
}

export interface ServiceMethodParam {
  name: string;
  type: string;
}

export interface PermissionPolicy {
  resource: string;
  role: string;
  action: string;
  effect: "allow" | "deny";
  condition?: string;
}

export interface PermissionDefinition {
  policies: PermissionPolicy[];
  rlsRules: string[];
}
